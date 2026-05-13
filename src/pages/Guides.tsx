import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Plus, Edit, Trash2, X, Clock, AlertCircle, ArrowLeft, LayoutDashboard, Info, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Guide, User } from '../types';
import { INITIAL_GUIDES } from '../data/mockData';
import { cn } from '../lib/utils';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

interface GuidesProps {
  user: User;
}

export default function Guides({ user }: GuidesProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const initialProcessed = useRef(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Lainnya',
    symptoms: [''],
    steps: ['']
  });

  useEffect(() => {
    if (location.state?.openGuide && !initialProcessed.current) {
      initialProcessed.current = true;
      setSearchTerm(location.state.openGuide);
    }
  }, [location]);

  useEffect(() => {
    const saved = localStorage.getItem('aksi_cepat_guides');
    if (saved) {
      const parsed: Guide[] = JSON.parse(saved);
      // Migrasi: Jika panduan tidak memiliki field symptoms, paksa update dari INITIAL_GUIDES
      const needsMigration = parsed.some(g => !g.symptoms || g.symptoms.length === 0);
      
      if (needsMigration || (parsed.length <= 3 && INITIAL_GUIDES.length > 3)) {
        setGuides(INITIAL_GUIDES);
        localStorage.setItem('aksi_cepat_guides', JSON.stringify(INITIAL_GUIDES));
      } else {
        setGuides(parsed);
      }
    } else {
      setGuides(INITIAL_GUIDES);
      localStorage.setItem('aksi_cepat_guides', JSON.stringify(INITIAL_GUIDES));
    }
  }, []);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search !== null) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let newGuides: Guide[];

    if (editingGuide) {
      newGuides = guides.map(g => g.id === editingGuide.id ? { 
        ...editingGuide, 
        ...formData, 
        lastUpdated: new Date().toISOString().split('T')[0] 
      } as Guide : g);
    } else {
      const newGuide: Guide = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        lastUpdated: new Date().toISOString().split('T')[0]
      } as Guide;
      newGuides = [...guides, newGuide];
    }

    setGuides(newGuides);
    localStorage.setItem('aksi_cepat_guides', JSON.stringify(newGuides));
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus panduan ini?')) {
      const newGuides = guides.filter(g => g.id !== id);
      setGuides(newGuides);
      localStorage.setItem('aksi_cepat_guides', JSON.stringify(newGuides));
    }
  };

  const openModal = (guide?: Guide) => {
    if (guide) {
      setEditingGuide(guide);
      setFormData({
        title: guide.title,
        category: guide.category,
        symptoms: guide.symptoms || [''],
        steps: guide.steps
      });
    } else {
      setEditingGuide(null);
      setFormData({
        title: '',
        category: 'Lainnya',
        symptoms: [''],
        steps: ['']
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGuide(null);
  };

  const addStep = () => setFormData(prev => ({ ...prev, steps: [...prev.steps, ''] }));
  const addSymptom = () => setFormData(prev => ({ ...prev, symptoms: [...(prev.symptoms || []), ''] }));
  
  const updateStep = (idx: number, val: string) => {
    const newSteps = [...formData.steps];
    newSteps[idx] = val;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const updateSymptom = (idx: number, val: string) => {
    const newSymptoms = [...(formData.symptoms || [])];
    newSymptoms[idx] = val;
    setFormData(prev => ({ ...prev, symptoms: newSymptoms }));
  };

  const removeStep = (idx: number) => setFormData(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }));
  const removeSymptom = (idx: number) => setFormData(prev => ({ ...prev, symptoms: (prev.symptoms || []).filter((_, i) => i !== idx) }));

  const handleGuideClick = (guideTitle: string) => {
    const clicksJson = localStorage.getItem('aksi_cepat_guide_clicks') || '{}';
    const clicks = JSON.parse(clicksJson);
    clicks[guideTitle] = (clicks[guideTitle] || 0) + 1;
    localStorage.setItem('aksi_cepat_guide_clicks', JSON.stringify(clicks));
    
    // Also enter focus mode locally
    setSearchTerm(guideTitle);
    navigate(location.pathname, { state: { openGuide: guideTitle } });
  };

  const isFocused = !!location.state?.openGuide && searchTerm.toLowerCase() === location.state.openGuide.toLowerCase();

  const handleClearFocus = () => {
    setSearchTerm('');
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        {isFocused && (
          <button 
            onClick={handleClearFocus}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Lihat Semua Panduan
          </button>
        )}
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800">
            {isFocused ? 'Detail Panduan Medis' : 'Panduan Penanganan'}
          </h1>
          <p className="text-slate-500">
            {isFocused ? `Menampilkan informasi detail untuk penanganan ${searchTerm}.` : 'Pelajari langkah-langkah pertolongan pertama yang benar.'}
          </p>
        </div>
        {user.role === 'ADMIN' && !isFocused && (
          <button 
            onClick={() => openModal()}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Tambah Panduan
          </button>
        )}
      </header>

      {/* Search Bar - Hidden in focus mode */}
      {!isFocused && (
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-red-500 transition-colors" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari panduan (ex: luka bakar, patah tulang)..."
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[32px] shadow-sm outline-none focus:ring-4 focus:ring-red-50 focus:border-red-500 transition-all text-lg font-medium"
          />
        </div>
      )}

      <div className={cn(
        "grid gap-6",
        isFocused ? "grid-cols-1 max-w-3xl mx-auto" : "grid-cols-1 md:grid-cols-2"
      )}>
        {filteredGuides.length > 0 ? filteredGuides.map((guide) => (
          <motion.div 
            key={guide.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => handleGuideClick(guide.title)}
            className="bg-white p-8 rounded-[38px] border border-slate-200 shadow-sm flex flex-col gap-6 group hover:border-red-500 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                  {guide.category}
                </span>
                <h3 className="text-[32px] font-black text-slate-900 leading-none tracking-tighter italic">{guide.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {user.role === 'ADMIN' && (
                  <>
                     <button 
                       onClick={(e) => { e.stopPropagation(); openModal(guide); }} 
                       className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors outline-none border border-transparent focus:border-blue-200"
                     >
                        <Edit className="w-5 h-5" />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleDelete(guide.id); }} 
                       className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors outline-none border border-transparent focus:border-red-200"
                     >
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </>
                )}
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                   <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {guide.symptoms && guide.symptoms.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3 text-blue-500" /> Ciri-ciri / Gejala:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {guide.symptoms.map((symptom, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-medium text-slate-600 italic">
                        • {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3 text-red-500" /> Langkah Penanganan:
              </p>
              <div className="space-y-3">
                {guide.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-slate-50/50 rounded-2xl group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                    <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-auto border-t border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-medium italic">Update: {guide.lastUpdated}</span>
               </div>
               <div className="flex items-center gap-1.5 text-red-600 px-3 py-1 bg-red-50 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Emergency Only</span>
               </div>
            </div>
            
            {/* Disclaimer in Card */}
            <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-slate-50 pt-4">
              DISCLAIMER: Panduan ini hanya untuk pertolongan darurat awal. Segera bawa korban ke Fasilitas Kesehatan atau hubungi tenaga medis profesional segera.
            </p>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
               <Search className="w-10 h-10" />
            </div>
            <p className="text-slate-500 font-medium text-lg italic">Wah, panduan "{searchTerm}" belum ditemukan. <br className="hidden md:block"/>Coba gunakan kata kunci lain.</p>
          </div>
        )}
      </div>

      {/* Admin Modal for Create/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
               onClick={closeModal}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                 <h2 className="text-2xl font-bold text-slate-900">{editingGuide ? 'Edit Panduan' : 'Tambah Panduan Baru'}</h2>
                 <button onClick={closeModal} className="p-2 hover:bg-white rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Kejadian</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Contoh: Luka Bakar Berat"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all font-medium appearance-none"
                  >
                    {['Luka Bakar', 'Patah Tulang', 'Tersedak', 'Serangan Jantung', 'Pendarahan Berat', 'Pingsan', 'Digigit Ular', 'Keracunan', 'Lainnya'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Ciri-ciri / Gejala</label>
                    <button type="button" onClick={addSymptom} className="text-xs font-bold text-blue-600 flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors">
                      <Plus className="w-3 h-3" /> Tambah Ciri
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(formData.symptoms || []).map((symptom, idx) => (
                      <div key={idx} className="flex gap-2">
                         <input 
                           required
                           type="text" 
                           value={symptom}
                           onChange={(e) => updateSymptom(idx, e.target.value)}
                           placeholder={`Ciri ke-${idx + 1}`}
                           className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                         />
                         <button 
                           type="button" 
                           onClick={() => removeSymptom(idx)}
                           disabled={formData.symptoms.length === 1}
                           className="p-3 text-red-400 hover:text-red-600 disabled:opacity-0 transition-all"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Langkah-langkah Penanganan</label>
                    <button type="button" onClick={addStep} className="text-xs font-bold text-red-600 flex items-center gap-1 px-3 py-1 bg-red-50 rounded-full hover:bg-red-100 transition-colors">
                      <Plus className="w-3 h-3" /> Tambah Langkah
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2">
                         <input 
                           required
                           type="text" 
                           value={step}
                           onChange={(e) => updateStep(idx, e.target.value)}
                           placeholder={`Langkah ke-${idx + 1}`}
                           className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-red-500 transition-all text-sm"
                         />
                         <button 
                           type="button" 
                           onClick={() => removeStep(idx)}
                           disabled={formData.steps.length === 1}
                           className="p-3 text-red-400 hover:text-red-600 disabled:opacity-0 transition-all"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all mt-6"
                >
                  {editingGuide ? 'Perbarui Panduan' : 'Simpan Panduan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

            <div className={cn(
              "p-8 bg-red-600 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-8 justify-between mt-8",
              isFocused && "hidden"
            )}>
         <div className="space-y-2">
            <h3 className="text-2xl font-bold">Butuh Bantuan Langsung?</h3>
            <p className="text-red-100 max-w-md">Asisten AI kami dapat menjawab pertanyaan darurat Anda secara spesifik dalam hitungan detik.</p>
         </div>
         <button onClick={() => navigate('/app/ai-chat')} className="px-8 py-4 bg-white text-red-600 rounded-2xl font-bold shadow-xl shadow-red-700/20 hover:scale-105 transition-transform whitespace-nowrap">
            Buka Chat Asisten AI
         </button>
      </div>
    </div>
  );
}
