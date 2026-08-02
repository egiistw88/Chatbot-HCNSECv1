import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserCheck, Cpu, Layers, Sparkles, Check, Sliders } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InstructionHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  currentSystemPrompt?: string;
  onUpdateSystemPrompt?: (newPrompt: string) => void;
}

const PERSONA_PRESETS = [
  {
    id: 'islamic_research',
    name: 'Asisten Riset Islam Klasik',
    tagline: 'Kajian kitab turats, fikih, sanad, dan sejarah Islam.',
    systemPrompt: 'Anda adalah asisten riset Islam klasik dan studi kitab turats yang tekun, ilmiah, dan obyektif. Tugas Anda adalah membantu pengguna memahami teks-teks klasik, istilah fikih, sanad, serta konteks sejarah dengan cermat.'
  },
  {
    id: 'software_engineer',
    name: 'Senior Software Engineer',
    tagline: 'Solusi pemrograman bersih, arsitektur sistem, dan debugging.',
    systemPrompt: 'Anda adalah Senior Software Engineer dan Architect berpengalaman. Berikan kode yang bersih, efisien, bermutu tinggi, serta penjelasan arsitektur yang komprehensif dengan praktik terbaik.'
  },
  {
    id: 'academic_researcher',
    name: 'Peneliti Akademis',
    tagline: 'Penulisan metodologis, analisis kritis, dan rujukan ilmiah.',
    systemPrompt: 'Anda adalah seorang Peneliti Akademis senior. Gunakan penalaran logis kritis, struktur metodologis yang jelas, serta pendekatan berbasis bukti ilmiah.'
  },
  {
    id: 'creative_writer',
    name: 'Penulis & Editor Kreatif',
    tagline: 'Pengembangan narasi, perbaikan tata bahasa, dan copywriting.',
    systemPrompt: 'Anda adalah seorang Penulis dan Editor Bahasa profesional. Bantu pengguna mengembangkan narasi menarik, menyempurnakan tata bahasa, dan menghasilkan teks yang menggugah.'
  },
  {
    id: 'concise_assistant',
    name: 'Asisten Ringkas & Efisien',
    tagline: 'Jawaban langsung pada inti masalah tanpa basa-basi.',
    systemPrompt: 'Anda adalah asisten AI yang sangat ringkas, padat, dan efisien. Berikan jawaban langsung pada poin utama tanpa pendahuluan atau basa-basi yang tidak perlu.'
  }
];

export function InstructionHierarchyModal({
  isOpen,
  onClose,
  conversationId,
  currentSystemPrompt,
  onUpdateSystemPrompt
}: InstructionHierarchyModalProps) {
  const [activeTab, setActiveTab] = useState<'persona' | 'rules'>('persona');
  const [systemPromptText, setSystemPromptText] = useState(currentSystemPrompt || '');
  
  // Developer Rules state
  const [requireSources, setRequireSources] = useState(true);
  const [distinguishFactOpinion, setDistinguishFactOpinion] = useState(true);
  const [antiHallucination, setAntiHallucination] = useState(true);
  const [structuredMarkdown, setStructuredMarkdown] = useState(true);

  // User Memory preferences state
  const [userPreference, setUserPreference] = useState('');

  useEffect(() => {
    if (currentSystemPrompt) {
      setSystemPromptText(currentSystemPrompt);
    }
  }, [currentSystemPrompt]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefRes = await fetch('/api/settings/user_memory_preference');
        if (prefRes.ok) {
          const data = await prefRes.json();
          if (data.value) setUserPreference(data.value);
        }
      } catch (e) {
        // quiet error handle
      }
    };
    if (isOpen) loadPreferences();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAll = async () => {
    try {
      if (onUpdateSystemPrompt && systemPromptText) {
        onUpdateSystemPrompt(systemPromptText);
      }

      await fetch('/api/settings/user_memory_preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: userPreference })
      });

      toast.success('Pengaturan instruksi disimpan');
      onClose();
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const applyPreset = (preset: typeof PERSONA_PRESETS[0]) => {
    setSystemPromptText(preset.systemPrompt);
    toast.success(`Persona "${preset.name}" dipilih`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Pengaturan AI &amp; Persona</h2>
              <p className="text-xs text-gray-500">Atur karakter, peran, dan pedoman tanggapan AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Navigation Tabs */}
        <div className="flex border-b border-gray-100 px-6 gap-4 text-xs font-medium text-gray-500 bg-white">
          <button
            onClick={() => setActiveTab('persona')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'persona'
                ? 'border-gray-900 text-gray-900 font-semibold'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-gray-800" />
            Persona &amp; Peran AI
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-gray-900 text-gray-900 font-semibold'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-gray-800" />
            Aturan &amp; Preferensi
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'persona' && (
            <div className="space-y-5">
              {/* Custom System Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 block">
                  Instruksi Peran (System Prompt):
                </label>
                <textarea
                  value={systemPromptText}
                  onChange={(e) => setSystemPromptText(e.target.value)}
                  placeholder="Deskripsikan peran atau karakter AI..."
                  rows={3}
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 font-medium bg-gray-50/50"
                />
              </div>

              {/* Preset Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-gray-900 block">
                  Pilih Preset Persona:
                </label>
                <div className="space-y-2">
                  {PERSONA_PRESETS.map((preset) => {
                    const isSelected = systemPromptText === preset.systemPrompt;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50 shadow-2xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900">{preset.name}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">{preset.tagline}</p>
                        </div>
                        {isSelected && (
                          <div className="p-1 rounded-md bg-gray-900 text-white shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-5">
              {/* Global User Preference */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 block">
                  Preferensi Gaya Pengguna (Global):
                </label>
                <input
                  type="text"
                  value={userPreference}
                  onChange={(e) => setUserPreference(e.target.value)}
                  placeholder="Contoh: Selalu jawab ringkas dan gunakan Bahasa Indonesia yang santun..."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-gray-50/50"
                />
              </div>

              {/* Safety Toggles */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-gray-900 block">
                  Pedoman Jawaban AI:
                </label>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Verifikasi Sumber &amp; Rujukan</span>
                      <span className="text-[11px] text-gray-500">Gunakan referensi faktual saat menjawab pertanyaan ilmiah</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireSources}
                      onChange={(e) => setRequireSources(e.target.checked)}
                      className="rounded text-gray-900 focus:ring-gray-900 w-4 h-4 accent-gray-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Pembeda Fakta &amp; Opini</span>
                      <span className="text-[11px] text-gray-500">Secara tegas memisahkan landasan fakta dengan pendapat</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={distinguishFactOpinion}
                      onChange={(e) => setDistinguishFactOpinion(e.target.checked)}
                      className="rounded text-gray-900 focus:ring-gray-900 w-4 h-4 accent-gray-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Pencegahan Halusinasi</span>
                      <span className="text-[11px] text-gray-500">Batasi klaim yang tidak didukung data atau konteks valid</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={antiHallucination}
                      onChange={(e) => setAntiHallucination(e.target.checked)}
                      className="rounded text-gray-900 focus:ring-gray-900 w-4 h-4 accent-gray-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Format Output Markdown Rapi</span>
                      <span className="text-[11px] text-gray-500">Gunakan poin-poin dan struktur baca yang bersih</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={structuredMarkdown}
                      onChange={(e) => setStructuredMarkdown(e.target.checked)}
                      className="rounded text-gray-900 focus:ring-gray-900 w-4 h-4 accent-gray-900"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-xs transition-all"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}

