import React, { useState, useEffect } from 'react';
import { X, User, Lock, Key, ShieldCheck, LogOut } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { toast } from 'react-hot-toast';

export function ProfileModal({
  isOpen,
  onClose,
  onLockApp
}: {
  isOpen: boolean;
  onClose: () => void;
  onLockApp: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirmRemovePinOpen, setIsConfirmRemovePinOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      setName(data.name || 'Egie');
      setEmail(data.email || 'egiegay08@gmail.com');
      setHasPin(data.hasPin);
      setPinEnabled(data.pinEnabled);
    } catch (e) {
      toast.error('Gagal memuat profil');
    }
  };

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Nama dan Email wajib diisi');
      return;
    }

    if (newPin) {
      if (newPin.length < 4) {
        toast.error('PIN Keamanan minimal 4 angka / Karakter');
        return;
      }
      if (newPin !== confirmPin) {
        toast.error('Konfirmasi PIN tidak cocok');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          newPin: newPin ? newPin.trim() : undefined,
          pinEnabled
        })
      });

      if (res.ok) {
        toast.success('Profil & Keamanan Lokal diperbarui');
        setNewPin('');
        setConfirmPin('');
        fetchProfile();
        onClose();
      } else {
        toast.error('Gagal menyimpan profil');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePinConfirm = async () => {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removePin: true })
      });
      toast.success('PIN Keamanan berhasil dihapus');
      setNewPin('');
      setConfirmPin('');
      fetchProfile();
    } catch (e) {
      toast.error('Gagal menghapus PIN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
            <User size={18} className="text-black" />
            <span>Profil & Otentikasi Lokal</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Header Avatar Display */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xl font-bold uppercase shrink-0">
              {name ? name.charAt(0) : 'U'}
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold text-sm truncate">{name || 'User'}</span>
              <span className="text-xs text-gray-300 truncate">{email}</span>
              <span className="text-[10px] text-green-400 font-mono mt-0.5 flex items-center gap-1">
                <ShieldCheck size={12} /> Otentikasi Lokal Aktif (Offline Encrypted)
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pengguna</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-gray-700" />
                <span className="text-xs font-semibold text-gray-900">PIN Keamanan Aplikasi</span>
              </div>
              {hasPin && (
                <span className="text-[10px] font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  PIN Terpasang
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-500">
              PIN lokal ini mengunci aplikasi sehingga hanya Anda yang dapat mengakses percakapan privat secara aman.
            </p>

            {hasPin && (
              <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                <label className="font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pinEnabled}
                    onChange={(e) => setPinEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span>Minta PIN saat membuka aplikasi</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsConfirmRemovePinOpen(true)}
                  className="text-[11px] text-red-600 font-semibold hover:underline"
                >
                  Hapus PIN
                </button>
              </div>
            )}

            <div className="space-y-2 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
              <div className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                <Key size={14} />
                <span>{hasPin ? 'Ganti PIN Keamanan Baru' : 'Buat PIN Keamanan Baru'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="PIN / Kode Akses"
                  className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                />
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Konfirmasi PIN"
                  className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            {hasPin && pinEnabled && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLockApp();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              >
                <LogOut size={13} />
                <span>Kunci Sesi Sekarang</span>
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </div>
        </form>

        <ConfirmModal
          isOpen={isConfirmRemovePinOpen}
          title="Hapus PIN Keamanan"
          message="Apakah Anda yakin ingin menghapus PIN Keamanan Lokal? Aplikasi tidak akan lagi meminta PIN saat dibuka."
          confirmText="Hapus PIN"
          cancelText="Batal"
          onConfirm={handleRemovePinConfirm}
          onClose={() => setIsConfirmRemovePinOpen(false)}
        />
      </div>
    </div>
  );
}
