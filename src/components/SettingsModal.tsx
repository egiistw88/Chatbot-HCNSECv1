import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEFAULT_MODELS = [
  { id: 'auto' },
  { id: 'gpt-4o-mini' },
  { id: 'gpt-4o' },
  { id: 'claude-3-5-sonnet' },
  { id: 'deepseek-r1' },
  { id: 'qwen-2.5-72b' },
  { id: 'llama-3.3-70b' }
];

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [fastModel, setFastModel] = useState('auto');
  const [thinkingModel, setThinkingModel] = useState('auto');
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/api_key').then(r => r.json()).then(data => {
        if (data.value) setApiKey(data.value);
      });
      fetch('/api/settings/fast_model').then(r => r.json()).then(data => {
        if (data.value) setFastModel(data.value);
      });
      fetch('/api/settings/thinking_model').then(r => r.json()).then(data => {
        if (data.value) setThinkingModel(data.value);
      });
      fetchModels();
    }
  }, [isOpen]);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setModels(data);
      } else {
        setModels(DEFAULT_MODELS);
        if (data.error) toast.error("Menggunakan daftar model standar");
      }
    } catch (e: any) {
      console.error(e);
      setModels(DEFAULT_MODELS);
    } finally {
      setLoadingModels(false);
    }
  };

  const modelList = models.length > 0 ? models : DEFAULT_MODELS;

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/api_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: apiKey })
      });
      await fetch('/api/settings/fast_model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: fastModel })
      });
      await fetch('/api/settings/thinking_model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: thinkingModel })
      });
      toast.success("Pengaturan berhasil disimpan");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Pengaturan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kunci API Khusus (Opsional)
              </label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mengganti kunci API server bawaan. Disimpan dengan aman di database lokal terenkripsi. Simpan kunci lalu buka ulang pengaturan untuk memuat model.
              </p>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pemilihan Model
                </label>
                <button 
                  onClick={fetchModels}
                  disabled={loadingModels}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-black disabled:opacity-50"
                >
                  <RefreshCw size={12} className={loadingModels ? "animate-spin" : ""} />
                  Muat Ulang Model
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model Cepat (Fast Mode)</label>
                  <select 
                    value={fastModel}
                    onChange={e => setFastModel(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black text-sm bg-white"
                  >
                    <option value={fastModel}>{fastModel}</option>
                    {modelList.filter(m => m.id !== fastModel).map(m => (
                      <option key={m.id} value={m.id}>{m.id}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model Berpikir (Thinking Mode)</label>
                  <select 
                    value={thinkingModel}
                    onChange={e => setThinkingModel(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black text-sm bg-white"
                  >
                    <option value={thinkingModel}>{thinkingModel}</option>
                    {modelList.filter(m => m.id !== thinkingModel).map(m => (
                      <option key={m.id} value={m.id}>{m.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black">
            Batal
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
