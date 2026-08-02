import React, { useState, useEffect } from 'react';
import { X, Brain, Plus, Trash2, ToggleLeft, ToggleRight, Sparkles, Filter, Database, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MemoryItem {
  id: string;
  type: string;
  category: string;
  content: string;
  confidence: number;
  source: string;
  enabled: boolean;
  createdAt: number;
}

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationId?: string | null;
}

const TYPE_MAP: Record<string, { label: string; icon: string; bg: string }> = {
  preference: { label: 'Preference', icon: '👤', bg: 'bg-blue-50 text-blue-700 border-blue-100' },
  fact: { label: 'Fact', icon: '📄', bg: 'bg-green-50 text-green-700 border-green-100' },
  project_context: { label: 'Project', icon: '🏗️', bg: 'bg-purple-50 text-purple-700 border-purple-100' },
  instruction: { label: 'Instruction', icon: '📜', bg: 'bg-amber-50 text-amber-700 border-amber-100' },
  temporary: { label: 'Temporary', icon: '⏳', bg: 'bg-gray-50 text-gray-700 border-gray-100' }
};

const CATEGORY_MAP: Record<string, { label: string; bg: string }> = {
  preference: { label: 'Preferensi', bg: 'bg-gray-100 text-gray-800' },
  language: { label: 'Bahasa', bg: 'bg-gray-100 text-gray-800' },
  interest: { label: 'Minat', bg: 'bg-gray-100 text-gray-800' },
  fact: { label: 'Fakta', bg: 'bg-gray-100 text-gray-800' },
  general: { label: 'Umum', bg: 'bg-gray-100 text-gray-700' }
};

export function MemoryModal({ isOpen, onClose, activeConversationId }: MemoryModalProps) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Memory Form
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('preference');
  const [newType, setNewType] = useState('fact');

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      toast.error('Gagal memuat memori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      toast.error('Isi memori tidak boleh kosong');
      return;
    }

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: newType,
          category: newCategory, 
          content: newContent.trim(), 
          enabled: true,
          confidence: 1.0,
          source: 'manual'
        })
      });

      if (res.ok) {
        toast.success('Memori disimpan');
        setNewContent('');
        setShowAddForm(false);
        fetchMemories();
      } else {
        toast.error('Gagal menyimpan memori');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat menyimpan memori');
    }
  };

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      setMemories(prev => prev.map(m => m.id === id ? { ...m, enabled: !currentEnabled } : m));
      await fetch(`/api/memories/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled })
      });
    } catch (e) {
      toast.error('Gagal mengubah status memori');
      fetchMemories();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setMemories(prev => prev.filter(m => m.id !== id));
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      toast.success('Memori dihapus');
    } catch (e) {
      toast.error('Gagal menghapus memori');
      fetchMemories();
    }
  };

  const handleAutoExtract = async () => {
    if (!activeConversationId) {
      toast.error('Buka percakapan aktif terlebih dahulu');
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch('/api/memories/auto-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversationId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.extractedCount > 0) {
          toast.success(`Berhasil mengekstrak ${data.extractedCount} memori baru`);
          fetchMemories();
        } else {
          toast('Tidak ada fakta memori baru ditemukan', { icon: 'ℹ️' });
        }
      } else {
        toast.error('Gagal mengekstrak memori');
      }
    } catch (e) {
      toast.error('Gagal mengekstrak memori');
    } finally {
      setExtracting(false);
    }
  };

  const filteredMemories = memories.filter(m => {
    if (selectedFilter === 'all') return true;
    return m.category === selectedFilter;
  });

  const activeCount = memories.filter(m => m.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Memori Pengguna</h2>
              <p className="text-xs text-gray-500">
                Fakta &amp; preferensi tersimpan ({activeCount}/{memories.length} memori aktif)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Action Header Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleAutoExtract}
              disabled={extracting || !activeConversationId}
              className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
            >
              {extracting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-gray-300" />}
              Ekstrak Otomatis dari Obrolan
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-gray-700" />
              Tambah Memori Manual
            </button>
          </div>

          {/* Add Manual Form */}
          {showAddForm && (
            <form onSubmit={handleAddMemory} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    {Object.entries(TYPE_MAP).map(([val, meta]) => (
                      <option key={val} value={val}>{meta.icon} {meta.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="preference">Preferensi</option>
                    <option value="language">Bahasa</option>
                    <option value="interest">Minat</option>
                    <option value="fact">Fakta</option>
                    <option value="general">Umum</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Contoh: Pengguna menyukai bahasa TypeScript..."
                  rows={2}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gray-900 text-white text-xs rounded-lg font-medium shadow-sm hover:bg-gray-800"
                >
                  Simpan Memori
                </button>
              </div>
            </form>
          )}

          {/* Filter Pills */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 pt-1">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <span className="text-gray-400 font-medium mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" />
              </span>
              {['all', 'preference', 'language', 'interest', 'fact'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedFilter === cat
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'Semua' : CATEGORY_MAP[cat]?.label || cat}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              {filteredMemories.length} item
            </span>
          </div>

          {/* Memory List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-gray-400">Memuat memori...</div>
            ) : filteredMemories.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Brain className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs text-gray-500 font-medium">Belum ada memori tersimpan</p>
              </div>
            ) : (
              filteredMemories.map((m) => {
                const typeMeta = TYPE_MAP[m.type] || TYPE_MAP.fact;
                const confidencePercent = Math.round(m.confidence * 100);
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                      m.enabled
                        ? 'bg-white border-gray-200 shadow-sm'
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 flex items-center gap-1 ${typeMeta.bg}`}>
                            {typeMeta.icon} {typeMeta.label}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            ID: {m.id.slice(-6)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-800 break-words font-medium leading-relaxed">
                          {m.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggle(m.id, m.enabled)}
                          className={`p-1 rounded-lg transition-colors ${
                            m.enabled ? 'text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {m.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${confidencePercent > 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                              style={{ width: `${confidencePercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{confidencePercent}% confidence</span>
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Database size={10} /> {m.source}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-800" />
            Diinjeksi otomatis ke AI
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-xs transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

