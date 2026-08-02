import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function LockScreen({
  onUnlock
}: {
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error('Masukkan PIN Anda');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() })
      });

      if (res.ok) {
        toast.success('Aplikasi berhasil dibuka!');
        onUnlock();
      } else {
        const data = await res.json();
        toast.error(data.error || 'PIN salah');
      }
    } catch (e) {
      toast.error('Gagal memverifikasi PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-2xl max-w-sm w-full p-6 border border-gray-700 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
          <Lock size={32} className="text-white" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Sesi Terkunci</h2>
          <p className="text-xs text-gray-400 mt-1">
            Masukkan PIN Keamanan Lokal Anda untuk mengakses percakapan privat.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN Anda"
              autoFocus
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-center text-lg font-mono tracking-widest text-white outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <KeyRound size={16} />
            <span>{loading ? 'Memeriksa...' : 'Buka Kunci'}</span>
          </button>
        </form>

        <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
          <ShieldAlert size={13} />
          <span>Keamanan Enkripsi Lokal SQLite</span>
        </div>
      </div>
    </div>
  );
}
