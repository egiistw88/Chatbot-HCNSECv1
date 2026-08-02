import React, { useState, useMemo } from 'react';
import { X, Cpu, Hash, Sparkles } from 'lucide-react';

interface TokenizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

export function estimateTokenCount(text: string): { tokens: number; words: number; chars: number } {
  if (!text) return { tokens: 0, words: 0, chars: 0 };
  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const symbolsCount = (text.match(/[{}[\]()<>=+*\-/_\\;:,.!?"'`@#$%^&]/g) || []).length;
  const estimatedTokens = Math.ceil((chars / 3.8) + (symbolsCount * 0.2));

  return {
    tokens: Math.max(1, estimatedTokens),
    words,
    chars
  };
}

function tokenizeTextVisual(text: string): Array<{ text: string; id: number; colorClass: string }> {
  if (!text) return [];

  const colors = [
    'bg-gray-800 text-gray-100 border-gray-700',
    'bg-gray-700 text-white border-gray-600',
    'bg-gray-800/90 text-gray-200 border-gray-700',
    'bg-gray-900 text-gray-300 border-gray-700',
  ];

  const chunks = text.match(/[A-Za-z0-9]+|[^A-Za-z0-9\s]+|\s+/g) || [text];
  
  return chunks.map((chunk, idx) => ({
    text: chunk,
    id: idx,
    colorClass: chunk.trim() === '' ? 'bg-gray-800/40 border-gray-800 text-gray-500 font-mono' : colors[idx % colors.length]
  }));
}

const MOCK_PROBABILITIES = [
  { token: ' sejarah', prob: '78.4%', barWidth: '78%' },
  { token: ' konsep', prob: '12.1%', barWidth: '12%' },
  { token: ' perkembangan', prob: '5.2%', barWidth: '5%' },
  { token: ' kebudayaan', prob: '3.1%', barWidth: '3%' },
];

export function TokenizerModal({ isOpen, onClose, initialText = '' }: TokenizerModalProps) {
  const [inputText, setInputText] = useState(
    initialText || 'Jelaskan secara ringkas sejarah perkembangan peradaban Islam klasik dan pengaruhnya terhadap sains.'
  );
  const [temperature, setTemperature] = useState<number>(0.7);

  const stats = useMemo(() => estimateTokenCount(inputText), [inputText]);
  const tokenChips = useMemo(() => tokenizeTextVisual(inputText), [inputText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Analisis Token &amp; Teks</h2>
              <p className="text-xs text-gray-500">Hitung jumlah token dan lihat pemecahan potongan kata AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-center">
              <span className="text-[11px] text-gray-500 block font-medium">Estimasi Token</span>
              <span className="text-lg font-bold text-gray-900 font-mono mt-0.5 block">{stats.tokens}</span>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-center">
              <span className="text-[11px] text-gray-500 block font-medium">Jumlah Kata</span>
              <span className="text-lg font-bold text-gray-900 font-mono mt-0.5 block">{stats.words}</span>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-center">
              <span className="text-[11px] text-gray-500 block font-medium">Karakter</span>
              <span className="text-lg font-bold text-gray-900 font-mono mt-0.5 block">{stats.chars}</span>
            </div>
          </div>

          {/* Input Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-900">Teks Uji Coba:</label>
              <button
                onClick={() => setInputText('')}
                className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Bersihkan
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik atau tempel teks di sini..."
              rows={3}
              className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 bg-gray-50/50 font-medium"
            />
          </div>

          {/* Visual Token Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-gray-800" />
              Potongan Token ({tokenChips.length} Visual Chunk):
            </label>
            <div className="p-3.5 bg-gray-900 rounded-xl border border-gray-800 min-h-[70px] flex flex-wrap gap-1.5 items-center font-mono text-xs">
              {tokenChips.length === 0 ? (
                <span className="text-gray-500 text-xs italic">Belum ada teks...</span>
              ) : (
                tokenChips.map((chip) => (
                  <span
                    key={chip.id}
                    className={`px-1.5 py-0.5 rounded-md border text-[11px] font-medium ${chip.colorClass}`}
                  >
                    {chip.text === ' ' ? '␣' : chip.text}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Next-Token Sampling */}
          <div className="p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gray-800" />
                Prediksi Kata Berikutnya
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-mono">Temp: {temperature}</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-16 accent-gray-900"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {MOCK_PROBABILITIES.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <span className="w-24 font-mono font-medium text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 shrink-0 text-ellipsis overflow-hidden">
                    "{p.token}"
                  </span>
                  <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gray-900 h-full rounded-full transition-all duration-300"
                      style={{ width: p.barWidth }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-gray-500 w-10 text-right shrink-0">{p.prob}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-xs transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

