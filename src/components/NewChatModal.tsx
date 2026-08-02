import React, { useState } from 'react';
import { X, Zap, Brain, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

const PROMPT_PRESETS = [
  { id: 'general', label: 'Asisten Umum', prompt: 'Anda adalah asisten yang membantu untuk belajar dan menyintesis informasi kompleks.' },
  { id: 'programmer', label: 'Ahli Pemrograman', prompt: 'Anda adalah ahli rekayasa perangkat lunak tingkat senior. Berikan kode yang bersih, efisien, praktik terbaik, dan jelaskan konsep dengan jelas.' },
  { id: 'translator', label: 'Penerjemah Profesional', prompt: 'Anda adalah penerjemah profesional. Terjemahkan teks dengan akurat, menjaga gaya, konteks, dan nuansa bahasa asli.' },
  { id: 'writer', label: 'Penulis Kreatif', prompt: 'Anda adalah penulis kreatif. Hasilkan teks yang memikat, imajinatif, dan terstruktur dengan narasi yang baik.' },
  { id: 'researcher', label: 'Peneliti Akademik', prompt: 'Anda adalah peneliti akademik. Berikan penjelasan yang mendalam, terstruktur, berbasis fakta, dan objektif.' },
  { id: 'ai', label: '✨ Buat dengan AI', prompt: '' },
  { id: 'custom', label: 'Kustom', prompt: '' }
];

export function NewChatModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (title: string, systemPrompt: string, mode: string) => void }) {
  const [title, setTitle] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(PROMPT_PRESETS[0].id);
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_PRESETS[0].prompt);
  const [aiPromptDesc, setAiPromptDesc] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [mode, setMode] = useState('fast');

  if (!isOpen) return null;

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    setSelectedPreset(presetId);
    if (presetId !== 'custom' && presetId !== 'ai') {
      const preset = PROMPT_PRESETS.find(p => p.id === presetId);
      if (preset) setSystemPrompt(preset.prompt);
    }
  };

  const generatePrompt = async () => {
    if (!aiPromptDesc.trim()) return;
    setIsGeneratingPrompt(true);
    try {
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPromptDesc })
      });
      const data = await res.json();
      if (data.prompt) {
        setSystemPrompt(data.prompt);
        toast.success('Prompt berhasil dibuat dengan AI');
      } else if (data.error) {
        toast.error("Gagal membuat prompt: " + data.error);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Terjadi kesalahan jaringan saat membuat prompt.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Percakapan Baru</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode Percakapan</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setMode('fast')} 
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center p-3 border rounded-lg text-sm transition-all", 
                  mode === 'fast' ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
              >
                <Zap size={20} className="mb-1" />
                <span>Jawaban Cepat</span>
              </button>
              <button 
                onClick={() => setMode('thinking')} 
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center p-3 border rounded-lg text-sm transition-all", 
                  mode === 'thinking' ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
              >
                <Brain size={20} className="mb-1" />
                <span>Mode Berpikir</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Penelitian Fisika"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Rekayasa (System Prompt)</label>
            <div className="relative mb-2">
              <select
                value={selectedPreset}
                onChange={handlePresetChange}
                className="w-full border border-gray-300 rounded px-3 py-2 appearance-none focus:outline-none focus:border-black bg-white"
              >
                {PROMPT_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
            </div>
            
            {selectedPreset === 'ai' && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="block text-xs font-medium text-gray-700 mb-1">Jelaskan asisten yang Anda butuhkan</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPromptDesc}
                    onChange={e => setAiPromptDesc(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        generatePrompt();
                      }
                    }}
                    placeholder="Misal: Asisten ahli gizi untuk diet keto..."
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-black"
                  />
                  <button 
                    onClick={generatePrompt}
                    disabled={isGeneratingPrompt || !aiPromptDesc.trim()}
                    className="bg-black text-white px-3 py-1.5 rounded text-sm disabled:opacity-50 flex items-center gap-1"
                  >
                    {isGeneratingPrompt ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Buat
                  </button>
                </div>
              </div>
            )}
            
            <textarea 
              value={systemPrompt} 
              onChange={e => {
                setSystemPrompt(e.target.value);
                setSelectedPreset('custom');
              }}
              rows={4}
              placeholder="Ketik instruksi khusus untuk AI..."
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black resize-none text-sm"
            />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black">
            Batal
          </button>
          <button 
            onClick={() => {
              onCreate(title || 'Obrolan Baru', systemPrompt, mode);
              setTitle('');
              setSystemPrompt(PROMPT_PRESETS[0].prompt);
              setSelectedPreset(PROMPT_PRESETS[0].id);
              setAiPromptDesc('');
              setMode('fast');
            }}
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800"
          >
            Buat
          </button>
        </div>
      </div>
    </div>
  );
}
