import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { User, Role } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Admin password check requested by user
    if (email === 'admin@gmail.com') {
      if (password !== 'admin123') {
        setError('Kata sandi untuk admin salah.');
        return;
      }
    }
    
    // Simple Mock Auth Logic
    const usersJson = localStorage.getItem('aksi_cepat_all_users') || '[]';
    const allUsers: User[] = JSON.parse(usersJson);
    
    let currentUser: User | undefined;

    if (isRegister) {
      // Register logic
      const isFirstUser = allUsers.length === 0;
      const role: Role = isFirstUser || email === 'admin@gmail.com' ? 'ADMIN' : 'USER';
      
      currentUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        role
      };
      
      localStorage.setItem('aksi_cepat_all_users', JSON.stringify([...allUsers, currentUser]));
    } else {
      // Login logic
      currentUser = allUsers.find(u => u.email === email);
      
      if (!currentUser) {
        // Just create a user for demo if not found
        currentUser = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name: name || (email === 'admin@gmail.com' ? 'Administrator' : 'Pengguna Baru'),
          role: email === 'admin@gmail.com' ? 'ADMIN' : 'USER'
        };
        // Save this new user to the list
        allUsers.push(currentUser);
        localStorage.setItem('aksi_cepat_all_users', JSON.stringify(allUsers));
      }
    }

    onLogin(currentUser);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Left Side: Illustration & Branding */}
      <div className="flex-1 bg-red-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between z-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-lg shadow-red-900/10">
              <Activity className="text-red-600 w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">AksiCepat</span>
          </Link>

          <Link 
            to="/" 
            className="flex items-center gap-2 text-red-100 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-full border border-red-500 bg-red-700/50 flex items-center justify-center group-hover:border-white group-hover:bg-red-500 transition-all shadow-lg shadow-red-900/20">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Kembali</span>
          </Link>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-20 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-700 rounded-full blur-3xl opacity-30 -ml-40 -mb-40"></div>

        <div className="z-10 max-w-md space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold leading-tight"
          >
            Satu Akun untuk Seluruh Kesiagaan Anda.
          </motion.h2>
          <p className="text-red-100 text-lg leading-relaxed">
            Dapatkan panduan terstruktur dan informasi faskes terdekat dalam satu genggaman.
          </p>
        </div>

        <div className="z-10 text-red-200 text-sm flex gap-6">
          <span>Panduan Terukur</span>
          <span>Respon Cepat</span>
          <span>Siaga 24/7</span>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">{isRegister ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}</h1>
            <p className="text-slate-500">
              {isRegister ? 'Sudah punya akun?' : 'Belum isi akun?'} 
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="ml-1 text-red-600 font-bold hover:underline"
              >
                {isRegister ? 'Masuk di sini' : 'Isi sekarang'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-600 text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
            {isRegister && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    required
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama Anda"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anda@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {!isRegister && (
              <div className="flex justify-end">
                <a href="#" className="text-sm font-semibold text-slate-400 hover:text-red-600 transition-colors">Lupa kata sandi?</a>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 group"
            >
              {isRegister ? 'Daftar Sekarang' : 'Masuk Ke Aplikasi'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
             <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
             <p className="text-xs text-blue-700 leading-relaxed">
               <strong>Insight Admin:</strong> Pendaftar pertama aplikasi ini akan diberikan akses sebagai Admin secara otomatis untuk mengelola konten medis.
             </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
