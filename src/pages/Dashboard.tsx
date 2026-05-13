import { useState, useEffect } from 'react';
import { 
  Zap, 
  Users, 
  Search, 
  Flame, 
  Activity, 
  Wind, 
  Heart, 
  Droplets, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Hospital
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Metric } from '../types';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metric>({ totalSeaches: 0, activeUsers: 0 });
  const [showUserList, setShowUserList] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchHistory, setSearchHistory] = useState<{ id: string; query: string; time: string; status: string }[]>([]);

  useEffect(() => {
    // Load metrics for admin
    const totalS = localStorage.getItem('aksi_cepat_searches');
    const usersJson = localStorage.getItem('aksi_cepat_all_users') || '[]';
    const loadedUsers = JSON.parse(usersJson);
    
    // Mock search history for display
    const mockHistory = [
      { id: '1', query: 'Ambulans Gawat Darurat', time: 'Baru saja', status: 'DITEMUKAN' },
      { id: '2', query: 'IGD RS Fatmawati', time: '5 menit lalu', status: 'DITEMUKAN' },
      { id: '3', query: 'Stok Darah AB+', time: '12 menit lalu', status: 'DIPROSES' },
      { id: '4', query: 'Puskesmas Terdekat', time: '30 menit lalu', status: 'DITEMUKAN' },
      { id: '5', query: 'Bantuan Tabung Oksigen', time: '1 jam lalu', status: 'KOSONG' },
    ];
    setSearchHistory(mockHistory);
    
    setAllUsers(loadedUsers);

    // Initialize searches if not exists
    if (!totalS) {
      localStorage.setItem('aksi_cepat_searches', mockHistory.length.toString());
    }

    const currentTotal = parseInt(totalS || mockHistory.length.toString());

    setMetrics({
      totalSeaches: currentTotal,
      activeUsers: loadedUsers.length
    });
  }, []);

  const handleStatClick = (type: 'SEARCH' | 'USER') => {
    if (type === 'SEARCH') {
      setShowSearchHistory(!showSearchHistory);
      setShowUserList(false);
    } else {
      setShowUserList(!showUserList);
      setShowSearchHistory(false);
    }
  };

  const emergencyCategories = [
    { name: 'Luka Bakar', icon: Flame, color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { name: 'Patah Tulang', icon: Activity, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { name: 'Tersedak', icon: Wind, color: 'bg-sky-50 text-sky-600 border-sky-100' },
    { name: 'Serangan Jantung', icon: Heart, color: 'bg-red-50 text-red-600 border-red-100' },
    { name: 'Pendarahan Berat', icon: Droplets, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { name: 'Pingsan', icon: Zap, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
    { name: 'Digigit Ular', icon: ShieldAlert, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { name: 'Keracunan', icon: AlertTriangle, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  ];

  const handleQuickAction = (category: string) => {
    // Increment search count for metrics
    const current = parseInt(localStorage.getItem('aksi_cepat_searches') || '0');
    localStorage.setItem('aksi_cepat_searches', (current + 1).toString());
    
    navigate(`/app/guides?search=${category}`);
  };

  if (user.role === 'ADMIN') {
    return (
      <div className="space-y-12">
        <header>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Akses Kontrol</p>
          <h1 className="text-[40px] font-black text-slate-900 tracking-tighter leading-none italic">ADMIN <span className="text-red-600">UNIT.</span></h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button 
            onClick={() => handleStatClick('SEARCH')}
            className={`bg-white p-8 rounded-[32px] border shadow-sm flex items-center justify-between group transition-all text-left ${showSearchHistory ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200 hover:border-red-500'}`}
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pencarian Darurat</p>
              <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">{metrics.totalSeaches}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${showSearchHistory ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}>
              <Search className="w-6 h-6" />
            </div>
          </button>

          <button 
            onClick={() => handleStatClick('USER')}
            className={`bg-white p-8 rounded-[32px] border shadow-sm flex items-center justify-between group transition-all text-left ${showUserList ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-500'}`}
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pengguna Aktif</p>
              <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">{metrics.activeUsers}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${showUserList ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <Users className="w-6 h-6" />
            </div>
          </button>

          <div className="col-span-1 md:col-span-2 bg-slate-900 p-8 rounded-[32px] text-white flex items-center justify-between overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
             <div className="z-10">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 italic">Real-time Metrics</p>
                <h3 className="text-2xl font-bold tracking-tight">Kesiagaan Sistem Aktif</h3>
             </div>
             <div className="z-10 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                <span className="text-xs font-black uppercase tracking-widest">Update 1m ago</span>
             </div>
          </div>
        </div>

        {showSearchHistory && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-xl overflow-hidden mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">LOG PENCARIAN</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Riwayat Pencarian Darurat Global</p>
              </div>
              <button 
                onClick={() => setShowSearchHistory(false)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Tutup Log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry ID</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kata Kunci</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {searchHistory.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-[10px] font-mono text-slate-400 uppercase tracking-tighter">#{s.id.padStart(4, '0')}</td>
                      <td className="py-4">
                        <p className="font-bold text-slate-900 tracking-tight leading-none">{s.query}</p>
                      </td>
                      <td className="py-4 text-xs font-medium text-slate-500">{s.time}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          s.status === 'DITEMUKAN' ? 'bg-emerald-50 text-emerald-600' : 
                          s.status === 'DIPROSES' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {showUserList && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">DATABASE PENGGUNA</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Daftar Akun yang Terdaftar di Sistem</p>
              </div>
              <button 
                onClick={() => setShowUserList(false)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Tutup Database
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-[10px] font-mono text-slate-400 uppercase tracking-tighter">#{u.id.slice(0, 4)}</td>
                      <td className="py-4">
                        <p className="font-bold text-slate-900 tracking-tight leading-none">{u.name}</p>
                      </td>
                      <td className="py-4 text-xs font-medium text-slate-500">{u.email}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          u.role === 'ADMIN' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center italic text-slate-400 text-sm">Belum ada pengguna terdaftar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-7 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-6 min-h-[320px]">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                 <Activity className="w-10 h-10" />
              </div>
              <div className="text-center space-y-2">
                 <h4 className="text-xl font-bold text-slate-800 tracking-tight">Visualisasi Data</h4>
                 <p className="text-slate-400 text-sm italic max-w-sm">Grafik pola pencarian dan aktivitas darurat akan diintegrasikan pada rilis berikutnya.</p>
              </div>
           </div>
           
           <div className="lg:col-span-5 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Navigasi Manajemen</p>
              <button onClick={() => navigate('/app/guides')} className="w-full text-left p-6 bg-white hover:bg-slate-50 border border-slate-200 rounded-[32px] flex items-center justify-between transition-all shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                       <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="font-bold text-slate-900 tracking-tight leading-none text-lg">Kelola Panduan</p>
                       <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">First Aid Library</p>
                    </div>
                 </div>
                 <ArrowRight className="w-5 h-5 text-slate-300" />
              </button>
              <button onClick={() => navigate('/app/facilities')} className="w-full text-left p-6 bg-white hover:bg-slate-50 border border-slate-200 rounded-[32px] flex items-center justify-between transition-all shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                       <Hospital className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="font-bold text-slate-900 tracking-tight leading-none text-lg">Kelola Faskes</p>
                       <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Medical Facilities</p>
                    </div>
                 </div>
                 <ArrowRight className="w-5 h-5 text-slate-300" />
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 relative bg-white rounded-[40px] p-10 border border-slate-200 overflow-hidden shadow-sm group">
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">Fundamental Response</p>
            <h1 className="text-[64px] md:text-[80px] leading-[0.85] font-black italic text-slate-900 tracking-tighter">
              THE GOLDEN <br/> <span className="text-red-600">HOUR.</span>
            </h1>
            <p className="max-w-md text-slate-500 mt-6 text-sm leading-relaxed font-medium">
              Setiap detik berharga. Penanganan yang tepat dalam 60 menit pertama dapat menentukan keselamatan nyawa korban. Pilih jenis kecelakaan untuk langkah instan.
            </p>
          </div>
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-red-50 rounded-full blur-3xl opacity-60 group-hover:bg-red-100 transition-colors duration-500"></div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 rounded-[40px] p-8 text-white h-full flex flex-col justify-between shadow-xl shadow-slate-200 min-h-[300px]">
           <button onClick={() => navigate('/app/ai-chat')} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Asisten AI P3K</p>
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Siaga Online 24/7</p>
              </div>
           </button>

           <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
                "Cara menangani luka bakar berat?" - Coba tanyakan pada asisten cerdas kami untuk instruksi instan.
              </p>
              <button 
                 onClick={() => navigate('/app/ai-chat')}
                 className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg"
              >
                Mulai Konsultasi AI
              </button>
           </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mx-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] italic">Quick Action Matrix</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Categories</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {emergencyCategories.map((cat, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickAction(cat.name)}
              className={cn(
                "p-6 rounded-[32px] border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center gap-4 transition-all hover:border-red-500 hover:shadow-xl hover:shadow-red-50 group min-h-[140px]"
              )}
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-inner", cat.color.replace('border-', ''))}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="font-black text-slate-900 text-xs uppercase tracking-[0.1em]">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0">
               <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
               <p className="font-black text-blue-900 uppercase text-xs tracking-widest">Protocol Insight</p>
               <p className="text-sm text-blue-700 leading-relaxed font-medium italic">
                 Selalu pastikan area kejadian aman sebelum melakukan pertolongan pertama pada korban.
               </p>
            </div>
         </div>

         <div className="p-8 bg-rose-50 border border-rose-100 rounded-[32px] flex items-center justify-between group cursor-pointer hover:bg-rose-100 transition-all shadow-sm" onClick={() => navigate('/app/blood-bank')}>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                  <Droplets className="w-5 h-5 fill-white" />
               </div>
               <div>
                  <p className="font-black text-rose-900 uppercase text-xs tracking-widest leading-none mb-1">Blood Connect</p>
                  <p className="text-sm text-rose-700 font-black italic tracking-tighter">Stok PMI Real-time</p>
               </div>
            </div>
            <ArrowRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-transform" />
         </div>

         <div className="p-8 bg-slate-900/5 border border-slate-200/50 rounded-[32px] flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faskes Terdekat</p>
               <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-800 tracking-tight">RS Medika Utama</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">119km</span>
               </div>
            </div>
            <button onClick={() => navigate('/app/facilities')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors">
               <ArrowRight className="w-5 h-5" />
            </button>
         </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
