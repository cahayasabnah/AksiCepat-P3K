import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, Zap, Heart, Phone, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-2 rounded-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">AksiCepat</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-all">
            Masuk
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-20 pb-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-bold tracking-wide uppercase">
              Panduan P3K Pintar
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mt-6 leading-[0.9] tracking-tighter italic">
              THE GOLDEN <br/> <span className="text-red-600">HOUR.</span>
            </h1>
            <p className="text-lg text-slate-500 mt-8 max-w-lg leading-relaxed font-medium italic">
              Kuasai detik-detik krusial. Selamatkan nyawa dengan panduan P3K cerdas dan informasi fasilitas kesehatan darurat.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/login" className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2">
              Mulai Sekarang <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-bold text-lg hover:border-slate-300 transition-all">
              Pelajari Lebih Lanjut
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 relative"
        >
          <div className="absolute -inset-4 bg-blue-50 rounded-[40px] -z-10 transform rotate-3"></div>
          <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col gap-6">
             <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <Zap className="w-5 h-5" />
                   </div>
                   <span className="font-bold text-slate-800">Quick Action Log</span>
                </div>
                <div className="w-12 h-6 bg-slate-100 rounded-full relative">
                   <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full"></div>
                </div>
             </div>
             <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                   <p className="text-sm font-bold text-red-700">Darurat: Luka Bakar</p>
                   <p className="text-xs text-red-600 mt-1">Dinginkan dengan air mengalir 20 menit...</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                   <p className="text-sm font-bold text-blue-700">Database Panduan Valid</p>
                   <p className="text-xs text-blue-600 mt-1">Langkah-langkah medis dari sumber terpercaya.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-sm font-bold text-slate-700">Faskes Terdekat</p>
                   <p className="text-xs text-slate-500 mt-1">RS Medika Utama - 500m</p>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 py-24 px-6 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">Mengapa Memilih AksiCepat?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Setiap menit di situasi darurat adalah 'Golden Hour' penentu keselamatan penderita.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Respon Cepat", desc: "Akses langkah darurat hanya dengan satu sentuhan.", color: "bg-red-50 text-red-600" },
              { icon: ShieldCheck, title: "Data Valid", desc: "Panduan dikelola oleh ahli medis secara terstruktur.", color: "bg-blue-50 text-blue-600" },
              { icon: Heart, title: "Tenang & Ter pandu", desc: "Instruksi yang tenang untuk membantu Anda tetap fokus.", color: "bg-emerald-50 text-emerald-600" }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", feature.color)}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <Activity className="text-red-600 w-6 h-6" />
          <span className="font-bold text-slate-900">AksiCepat - P3K Pintar</span>
        </div>
        <div className="flex gap-8 text-sm text-slate-500 font-medium tracking-wide">
          <a href="#" className="hover:text-red-600 transition-colors uppercase">Tentang</a>
          <a href="#" className="hover:text-red-600 transition-colors uppercase">Panduan</a>
          <a href="#" className="hover:text-red-600 transition-colors uppercase">Hubungi Kami</a>
        </div>
        <p className="text-sm text-slate-400">© 2026 AksiCepat. Semua Hak Dilindungi.</p>
      </footer>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
