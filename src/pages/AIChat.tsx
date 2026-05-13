import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, AlertCircle, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const SYSTEM_PROMPT = `
You are AksiCepat AI Assistant, an expert in First Aid (P3K). 
Your goal is to provide clear, step-by-step instructions for emergency situations.

RULES:
1. ALWAYS start your response with a clear DISCLAIMER in Indonesian: "PERINGATAN: Ini adalah panduan pertolongan pertama sementara. Segera hubungi tenaga medis profesional atau ambulans (119) untuk penanganan lebih lanjut."
2. Provide instructions in Indonesian language.
3. Be calm, supportive, and extremely clear.
4. FORMATTING: Use markdown strictly. Use numbered lists (1., 2., etc.) for steps. Use double line breaks between steps. Use bold for key actions.
5. If a situation is life-threatening (e.g., heart attack, massive bleeding), emphasize the need to call emergency services immediately.
6. Do not provide medical diagnoses, only first aid procedures.
`;

export default function AIChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([
    { role: 'ai', content: 'Halo! Saya asisten AksiCepat. Ada situasi darurat apa yang bisa saya bantu sekarang?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const initialProcessed = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (location.state?.query && !initialProcessed.current) {
      initialProcessed.current = true;
      const initialQuery = location.state.query;
      // Trigger send automatically
      processInitialQuery(initialQuery);
    }
  }, [location]);

  const processInitialQuery = async (query: string) => {
    // Increment search count for analytics
    const currentSearches = parseInt(localStorage.getItem('aksi_cepat_searches') || '0');
    localStorage.setItem('aksi_cepat_searches', (currentSearches + 1).toString());

    // Store log for analytics
    const userJson = localStorage.getItem('aksi_cepat_current_user');
    const currentUser = userJson ? JSON.parse(userJson) : null;
    const logsJson = localStorage.getItem('aksi_cepat_search_logs') || '[]';
    const logs = JSON.parse(logsJson);
    logs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      query: query,
      userName: currentUser?.name || 'Anonim',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('aksi_cepat_search_logs', JSON.stringify(logs.slice(0, 100))); // Keep last 100

    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      const aiResponse = response.text || "Maaf, saya tidak bisa memproses permintaan Anda saat ini.";
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Terjadi kesalahan pada sistem asisten AI. Silakan periksa koneksi Anda atau coba lagi nanti." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    // Increment search count for analytics
    const currentSearches = parseInt(localStorage.getItem('aksi_cepat_searches') || '0');
    localStorage.setItem('aksi_cepat_searches', (currentSearches + 1).toString());

    const userMessage = input.trim();
    
    // Store log for analytics
    const userJson = localStorage.getItem('aksi_cepat_current_user');
    const currentUser = userJson ? JSON.parse(userJson) : null;
    const logsJson = localStorage.getItem('aksi_cepat_search_logs') || '[]';
    const logs = JSON.parse(logsJson);
    logs.unshift({
      id: Math.random().toString(36).substr(2, 9),
      query: userMessage,
      userName: currentUser?.name || 'Anonim',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('aksi_cepat_search_logs', JSON.stringify(logs.slice(0, 100)));

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      const aiResponse = response.text || "Maaf, saya tidak bisa memproses permintaan Anda saat ini.";
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Terjadi kesalahan pada sistem asisten AI. Silakan periksa koneksi Anda atau coba lagi nanti." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
      </div>

      <motion.div 
        layout
        className="min-h-[500px] h-fit max-h-[85vh] flex flex-col bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden text-white border border-white/5 transition-all duration-500"
      >
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-400 flex items-center justify-center animate-pulse">
               <Bot className="w-6 h-6 text-slate-900" />
            </div>
            <div>
               <h2 className="text-sm font-black uppercase tracking-[0.2em]">Asisten AI P3K</h2>
               <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest leading-none mt-1">Sistem Siaga Aktif</p>
            </div>
         </div>
         <div className="hidden md:block">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">Neural Response Unit</span>
         </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide max-h-[600px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-5 rounded-[24px] text-sm font-medium leading-[1.6] shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-slate-700 text-white rounded-tr-none border border-white/10' 
                  : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/5'
              }`}>
                {msg.role === 'ai' ? (
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mx-2">
                {msg.role === 'ai' ? 'Asisten AI' : 'Pengguna'}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="p-5 bg-slate-800/50 border border-white/5 rounded-[24px] rounded-tl-none flex items-center gap-3 text-cyan-400 italic text-[10px] font-black uppercase tracking-wider">
                <Loader2 className="w-3 h-3 animate-spin" />
                Menganalisis Gejala...
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-6 bg-white/5 border-t border-white/5 flex gap-4 items-center">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketikkan kondisi darurat Anda..."
          className="flex-1 px-6 py-4 bg-slate-800 border border-white/10 rounded-2xl outline-none focus:bg-slate-700 focus:border-cyan-500 transition-all text-sm font-medium placeholder:text-slate-500"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-14 h-14 bg-cyan-500 text-slate-900 rounded-2xl flex items-center justify-center hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-30 shrink-0 group"
        >
          <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </form>
      </motion.div>
    </div>
  );
}
