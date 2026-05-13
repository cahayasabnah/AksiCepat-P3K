import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Hospital, 
  MessageSquare, 
  Droplets,
  ClipboardList,
  BarChart3,
  LogOut, 
  Menu, 
  Activity,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AppLayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
}

export default function AppLayout({ children, user, onLogout }: AppLayoutProps) {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Beranda Darurat', path: '/app', icon: LayoutDashboard },
    { name: 'Panduan Medis', path: '/app/guides', icon: BookOpen },
    { name: 'Fasilitas Kesehatan', path: '/app/facilities', icon: Hospital },
    { name: 'Stok Darah (PMI)', path: '/app/blood-bank', icon: Droplets },
    { name: 'Laporan & Analitik', path: '/app/analytics', icon: BarChart3 },
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Side Menu */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter text-red-600">AKSICEPAT<span className="text-slate-800 tracking-normal">+</span></h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-bold italic">Emergency Response Unit</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-red-50 text-red-700 border border-red-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              )}
            >
              <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110")} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-900 rounded-2xl p-4 text-white text-center shadow-lg shadow-slate-200">
            <p className="text-[10px] opacity-60 uppercase tracking-widest mb-1 font-bold">Nomor Darurat</p>
            <p className="text-xl font-bold">119 / 112</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <header className="h-20 bg-slate-50/80 backdrop-blur-md px-10 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Selamat Datang, {user.name.split(' ')[0]}</p>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Dashboard Respons</h2>
          </div>
          
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-black text-slate-400 hover:text-red-600 transition-colors uppercase tracking-[0.2em]"
          >
            Selesaikan Sesi
          </button>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto px-10 pb-20 relative">
           <motion.div
             key={window.location.pathname}
             initial={{ opacity: 0, x: 10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.4 }}
             className="max-w-full mx-auto"
           >
             {children}
           </motion.div>


        </div>
      </main>
    </div>
  );
}
