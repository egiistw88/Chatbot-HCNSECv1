import React, { useState, useEffect } from 'react';
import { X, Sparkles, Brain, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function EditChatModal({
  isOpen,
  onClose,
  conversation,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  conversation: any;
  onSave: (id: string, title: string, systemPrompt: string, mode: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [mode, setMode] = useState('fast');
  const [generating, setGenerating] = useState(false);
  const [promptTopic, setPromptTopic] = useState('');

  useEffect(() => {
    if (conversation) {
      setTitle(conversation.title || '');
      setSystemPrompt(conversation.systemPrompt || '');
      setMode(conversation.mode || 'fast');
    }
  }, [conversation]);

  if (!isOpen || !conversation) return null;

  const handleGeneratePrompt = async () => {
    if (!promptTopic.trim()) {
      toast.error('Masukkan topik atau deskripsi instruksi');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/prompt-engineer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: promptTopic })
      });
      const data = await res.json();
      if (data.prompt) {
        setSystemPrompt(data.prompt);
        toast.success('System Prompt AI berhasil dibuat!');
      } else {
        toast.error('Gagal membuat prompt');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat membuat prompt');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul obrolan tidak boleh kosong');
      return;
    }
    await onSave(conversation.id, title, systemPrompt, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-lg w-full border border-gray-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-semibold text-gray-900">Ubah Details Obrolan</h2>
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Judul Obrolan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Diskusi Pemrograman React"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mode Obrolan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('fast')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  mode === 'fast' 
                    ? 'border-black bg-black text-white' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Zap size={15} />
                <div className="text-left">
                  <div>Mode Cepat</div>
                  <div className={`text-[10px] ${mode === 'fast' ? 'text-gray-300' : 'text-gray-500'}`}>Respons kilat</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('thinking')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  mode === 'thinking' 
                    ? 'border-black bg-black text-white' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Brain size={15} />
                <div className="text-left">
                  <div>Mode Berpikir</div>
                  <div className={`text-[10px] ${mode === 'thinking' ? 'text-gray-300' : 'text-gray-500'}`}>Analisis mendalam</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Petunjuk Sistem (System Prompt)
              </label>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Tentukan kepribadian, peran, atau aturan khusus untuk AI dalam obrolan ini..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black font-mono text-xs"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
              <Sparkles size={14} className="text-amber-500" />
              <span>Bantuan AI Prompt Engineer</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                placeholder="Topik: misal 'Pakar Dokter Gigi', 'Editor Artikel'"
                className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-md outline-none focus:border-black bg-white"
              />
              <button
                type="button"
                onClick={handleGeneratePrompt}
                disabled={generating}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-black disabled:opacity-50 shrink-0"
              >
                {generating ? 'Membuat...' : 'Buat Prompt'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
