import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  Hospital, 
  Book, 
  Droplets, 
  FileDown, 
  ChevronDown,
  TrendingUp,
  ArrowUpRight,
  Search,
  LayoutDashboard,
  X,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useNavigate } from 'react-router-dom';

import { User } from '../types';

export default function Analytics({ user }: { user?: User }) {
  const [period, setPeriod] = useState('Bulan Ini');
  const navigate = useNavigate();

  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  // Get registered users
  const registeredUsers = JSON.parse(localStorage.getItem('aksi_cepat_all_users') || '[]');
  
  // Get users from guide logs
  const guideLogs = JSON.parse(localStorage.getItem('aksi_cepat_guide_logs') || '[]');
  const guideUserEmails = new Set(guideLogs.map((l: any) => l.userEmail));
  
  // Get users from blood orders
  const bloodOrders = JSON.parse(localStorage.getItem('aksi_cepat_blood_orders') || '[]');
  const bloodUserEmails = new Set(bloodOrders.map((o: any) => o.userEmail));

  // Filter unique registered users with normalization
  const allUserEmails = new Set([
    ...registeredUsers.map((u: any) => u.email?.toLowerCase().trim())
  ].filter(Boolean));

  // Build full user list with details based strictly on registered users
  const finalUsers = Array.from(allUserEmails).map(email => {
    const regUser = registeredUsers.find((u: any) => u.email?.toLowerCase().trim() === email);
    const guideLog = guideLogs.find((l: any) => l.userEmail?.toLowerCase().trim() === email);
    const orderLog = bloodOrders.find((o: any) => o.userEmail?.toLowerCase().trim() === email);
    
    return {
      email,
      name: regUser?.name || guideLog?.userName || orderLog?.userName || email?.split('@')[0] || 'Anonymous',
      role: regUser?.role || (email === 'admin@gmail.com' ? 'ADMIN' : 'USER'),
      lastActivity: [guideLog?.timestamp, orderLog?.timestamp].filter(Boolean).sort().reverse()[0] || 'Baru Saja'
    };
  });

  const totalSearches = parseInt(localStorage.getItem('aksi_cepat_searches') || '0');
  
  // Use registered users count for accuracy
  const usersCount = finalUsers.length;
  
  // Simulated success rate based on searches
  const tertangani = totalSearches > 0 ? Math.floor((totalSearches / (totalSearches + 2)) * 100) : 0;

  const metricCards = [
    {
      title: 'Total Insiden (Beranda Darurat)',
      value: totalSearches.toLocaleString(),
      subValue: `${tertangani}% Tertangani`,
      icon: Activity,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      trend: `+${Math.floor(Math.random() * 5) + 5}% dari bln lalu`
    },
    {
      title: 'Rata-rata Waktu Respons',
      value: (6.2 - (totalSearches * 0.001) > 3 ? (6.2 - (totalSearches * 0.001)).toFixed(1) : "3.0") + ' Min',
      subValue: '-45 Detik vs target',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: 'Performa Optimal'
    },
    {
      title: 'Aktivitas Pengguna (Terdaftar)',
      value: usersCount.toLocaleString(),
      subValue: 'Akun Aktif',
      icon: UserIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      trend: 'Database Sinkron'
    }
  ];

  // Load real guide logs for personalized analytics
  const guideLogsJson = localStorage.getItem('aksi_cepat_guide_logs') || '[]';
  const allGuideLogs = JSON.parse(guideLogsJson);
  
  // Also keep backward compatibility with old aggregate clicks for now
  const legacyClicksJson = localStorage.getItem('aksi_cepat_guide_clicks') || '{}';
  const legacyClicks = JSON.parse(legacyClicksJson);

  // Filter logs based on role
  let relevantLogs = allGuideLogs;
  if (user?.role !== 'ADMIN') {
    relevantLogs = allGuideLogs.filter((log: any) => log.userEmail === user?.email);
  }

  // Aggregate logs into counts
  const aggregatedClicks: { [key: string]: number } = {};
  
  // Process detailed logs
  relevantLogs.forEach((log: any) => {
    aggregatedClicks[log.guideTitle] = (aggregatedClicks[log.guideTitle] || 0) + 1;
  });

  // If we are admin and detailed logs are sparse, merge with legacy data for completeness
  if (user?.role === 'ADMIN' && allGuideLogs.length === 0) {
    Object.entries(legacyClicks).forEach(([title, count]) => {
      aggregatedClicks[title] = (aggregatedClicks[title] || 0) + (count as number);
    });
  }

  const guideEntries = Object.entries(aggregatedClicks)
    .map(([label, count]) => ({ 
      originalLabel: label,
      label: label.toUpperCase(), 
      count: user?.role === 'ADMIN' ? (count as number) : 1,
      color: 'bg-indigo-500'
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxClicks = guideEntries.length > 0 ? guideEntries[0].count : 1;
  const guidesData = guideEntries.map(g => ({
    ...g,
    value: Math.floor((g.count / maxClicks) * 100),
    color: g.label.includes('CPR') ? 'bg-emerald-500' : 
           g.label.includes('LUKA') ? 'bg-blue-500' :
           g.label.includes('PATAH') ? 'bg-orange-500' : 'bg-rose-500'
  }));

  const [searchTerm, setSearchTerm] = useState('');

  // Load real blood stats or initialize if empty
  const [bloodStats, setBloodStats] = useState(() => {
    const saved = localStorage.getItem('aksi_cepat_blood_stats');
    if (saved) return JSON.parse(saved);
    return [
      { type: 'A', request: 0, lastFacility: '-', status: 'Aman' },
      { type: 'B', request: 0, lastFacility: '-', status: 'Aman' },
      { type: 'AB', request: 0, lastFacility: '-', status: 'Aman' },
      { type: 'O', request: 0, lastFacility: '-', status: 'Aman' }
    ];
  });

  const updateBloodStatus = (type: string, newStatus: string) => {
    const updated = bloodStats.map((item: any) => 
      item.type === type ? { ...item, status: newStatus } : item
    );
    setBloodStats(updated);
    localStorage.setItem('aksi_cepat_blood_stats', JSON.stringify(updated));
  };

  const resetBloodData = (type: string) => {
    const updated = bloodStats.map((item: any) => 
      item.type === type ? { ...item, request: 0, lastFacility: '-', status: 'Aman' } : item
    );
    setBloodStats(updated);
    localStorage.setItem('aksi_cepat_blood_stats', JSON.stringify(updated));
  };

  const filteredStats = bloodStats.filter((item: any) => {
    const search = (searchTerm || '').toLowerCase();
    const type = (item.type || '').toLowerCase();
    const facility = (item.lastFacility || '').toLowerCase();
    const status = (item.status || '').toLowerCase();
    
    return type.includes(search) || (search.length > 0 && search.includes(type)) || facility.includes(search) || status.includes(search);
  });

  const bloodStockData = filteredStats.map((item: any) => {
    const ordersJson = localStorage.getItem('aksi_cepat_blood_orders') || '[]';
    const allOrders = JSON.parse(ordersJson);
    
    // Find orders for this specific blood type
    // Note: in orders, bloodType is "A+", "A-", etc. in bloodStats it's "A", "B", etc.
    const relevantOrders = allOrders.filter((o: any) => o.bloodType.replace(/[+-]/g, '') === item.type);
    
    let requestCount = item.request;
    let lastFacility = item.lastFacility;
    let displayStatus = item.status;
    let statusColor = item.status === 'Aman' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100';
    
    // Collect unique names of requesters
    const requesters = Array.from(new Set(relevantOrders.map((o: any) => o.userName || o.userEmail || 'Anonim')));

    if (user?.role !== 'ADMIN') {
      const userOrders = relevantOrders.filter((o: any) => o.userEmail === user?.email);
      
      requestCount = userOrders.reduce((sum: number, o: any) => sum + o.quantity, 0);
      lastFacility = userOrders.length > 0 ? userOrders[userOrders.length - 1].hospital : '-';
      
      const hasPending = userOrders.some((o: any) => o.status === 'BERHASIL DIPESAN');
      const hasCompleted = userOrders.some((o: any) => o.status === 'SELESAI');
      const hasRejected = userOrders.some((o: any) => o.status === 'DITOLAK');
      
      if (hasPending) {
        displayStatus = 'Diproses';
        statusColor = 'bg-amber-50 text-amber-600 border-amber-100';
      } else if (hasCompleted) {
        displayStatus = 'Selesai';
        statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
      } else if (hasRejected) {
        displayStatus = 'Ditolak';
        statusColor = 'bg-rose-50 text-rose-600 border-rose-100';
      } else {
        displayStatus = 'Tidak Ada';
        statusColor = 'bg-slate-50 text-slate-400 border-slate-100';
      }
    } else {
      // For Admin, ensure requestCount accurately reflects total orders if bloodStats was stale
      const totalTypeRequest = relevantOrders.reduce((sum: number, o: any) => sum + o.quantity, 0);
      if (totalTypeRequest > requestCount) requestCount = totalTypeRequest;
      if (relevantOrders.length > 0) lastFacility = relevantOrders[0].hospital;
    }

    return {
      ...item,
      request: requestCount,
      lastFacility: lastFacility,
      status: displayStatus,
      color: statusColor,
      requesters: requesters
    };
  });

  const handleExport = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('id-ID');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.setFont('helvetica', 'bold');
    doc.text('AKSI CEPAT', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('helvetica', 'normal');
    doc.text('LAPORAN TERPADU & ANALITIK P3K PINTAR', 14, 28);
    doc.text(`Dicetak pada: ${timestamp}`, 14, 34);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 40, 196, 40);

    // Executive Summary
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Eksekutif', 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [['Metrik', 'Nilai', 'Status/Trend']],
      body: metricCards.map(c => [c.title, c.value, c.subValue + ' (' + c.trend + ')']),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
    });

    // Medical Guides
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > 250) { doc.addPage(); finalY = 20; }
    doc.setFontSize(14);
    doc.text('Analitik Panduan Medis', 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Judul Panduan', 'Total Akses']],
      body: guidesData.map(g => [g.label, g.count]),
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }, // emerald-600
    });

    // Blood Stock
    finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > 250) { doc.addPage(); finalY = 20; }
    doc.setFontSize(14);
    doc.text('Status Logistik Darah Terpadu', 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Tipe', 'Pemesan', 'Permintaan', 'Fasilitas Terakhir', 'Status']],
      body: bloodStockData.map(b => [b.type, b.requesters.join(', ') || '-', b.request, b.lastFacility || '-', b.status]),
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] }, // rose-600
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
            `Halaman ${i} dari ${pageCount} - Laporan Otomatis Sistem AksiCepat`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`AksiCepat_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 p-6 lg:p-10 print:bg-white print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-full { width: 100% !important; padding: 20mm !important; }
          .card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
        }
      `}} />

      <div className="max-w-7xl mx-auto space-y-8 print-full">
        {/* Header & Filter */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-900 rounded-lg text-white">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">Laporan Terpadu & Analitik</h1>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-11">Pusat Komando & Monitoring Data Real-time</p>
          </div>

          <div className="flex items-center gap-3 no-print">
            <div className="relative group">
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none pl-6 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all cursor-pointer"
              >
                <option>Hari Ini</option>
                <option>Minggu Ini</option>
                <option>Bulan Ini</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-900 transition-colors" />
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
            >
              <FileDown className="w-4 h-4" />
              Export to PDF
            </button>
          </div>
        </header>

        {/* Executive Summary Row - Admin Only */}
        {user?.role === 'ADMIN' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metricCards.map((card, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => card.title.includes('Aktivitas') && setIsUsersModalOpen(true)}
                className={`bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all ${card.title.includes('Aktivitas') ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.title}</p>
                    <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">{card.value}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${card.color} bg-white shadow-sm px-2 py-1 rounded-lg border border-slate-100`}>{card.subValue}</span>
                    <p className="text-[9px] font-medium text-slate-400 italic">{card.trend}</p>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-[24px] ${card.bg} flex items-center justify-center ${card.color} transition-transform group-hover:rotate-12`}>
                  <card.icon className="w-8 h-8" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* User Analytics Row */}
        <div className="grid grid-cols-1 gap-8">
          {/* Medical Guides Analytics */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">
                  {user?.role === 'ADMIN' ? 'Artikel Panduan Terpopuler' : 'Riwayat Baca Panduan'}
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  {user?.role === 'ADMIN' ? 'Data Akses Materi Penyelamatan' : 'Materi yang telah Anda pelajari'}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <Book className="w-6 h-6" />
              </div>
            </div>
            <div className="p-10 space-y-8">
              {guidesData.length > 0 ? guidesData.map((guide, idx) => (
                <div 
                  key={idx} 
                  onClick={() => navigate('/app/guides', { state: { openGuide: guide.originalLabel } })}
                  className="space-y-3 cursor-pointer group/guide"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest group-hover/guide:text-indigo-600 transition-colors">{guide.label}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-900 tracking-tighter uppercase">{guide.count} Akses</span>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 group-hover/guide:border-indigo-200 transition-all">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${guide.value}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full ${guide.color} rounded-full`}
                    />
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                    <Book className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest tracking-tighter">
                      {user?.role === 'ADMIN' ? 'BELUM ADA DATA' : 'BELUM ADA RIWAYAT BACA'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">
                      {user?.role === 'ADMIN' ? 'PENGGUNA BELUM MEMBUKA PANDUAN' : 'Selesaikan panduan untuk melihat progres Anda'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Emergency Logistics Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                 <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">Status Kebutuhan Stok Darah</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Logistik PMI & Bank Darah Terpadu</p>
              </div>
            </div>

            <div className="relative group/search max-w-xs w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/search:text-rose-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Cari Tipe/Lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-500/5 transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Golongan Darah</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Pemesan</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Permintaan Masuk</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Lokasi / Alamat RS</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Status Kritis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bloodStockData.map((blood, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm">{blood.type}</div>
                         <p className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">Tipe {blood.type}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      {blood.requesters.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {blood.requesters.map((name: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded-md whitespace-nowrap">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300 italic">-</span>
                      )}
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-300" />
                        <p className="text-sm font-black text-slate-700 tracking-tighter">{blood.request} Kantong</p>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2">
                        <Hospital className="w-4 h-4 text-slate-300" />
                        <p className="text-sm font-bold text-slate-600 tracking-tight">{blood.lastFacility || '-'}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {user?.role === 'ADMIN' && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                            <button 
                              onClick={() => updateBloodStatus(blood.type, blood.status === 'Aman' ? 'Defisit' : 'Aman')}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                              title="Ubah Status"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => resetBloodData(blood.type)}
                              className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-lg transition-colors"
                              title="Reset Data"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${blood.color}`}>
                          {blood.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <ArrowUpRight className="w-4 h-4 text-blue-600" />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sinkronisasi Terakhir: 1 Menit Lalu</p>
            </div>
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Detail Logistik Lengkap</button>
          </div>
        </motion.div>
      </div>

      {/* Users List Modal */}
      <AnimatePresence>
        {isUsersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUsersModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">Daftar Pengguna</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status Aktivitas Akun Terdaftar</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsUsersModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="space-y-4">
                  {finalUsers.length > 0 ? finalUsers.map((u: any, i: number) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                          <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{u.name || 'Anonymous'}</p>
                          <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Aktivitas: {u.lastActivity === 'Baru Saja' ? 'Aktif' : (new Date(u.lastActivity).toLocaleDateString())}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                          {u.role || 'USER'}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-20 text-slate-300 italic">Belum ada akun terdaftar</div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setIsUsersModalOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Tutup Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
