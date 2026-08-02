import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { SettingsModal } from './components/SettingsModal';
import { NewChatModal } from './components/NewChatModal';
import { EditChatModal } from './components/EditChatModal';
import { ProfileModal } from './components/ProfileModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LockScreen } from './components/LockScreen';
import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingConvo, setEditingConvo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingConvoId, setDeletingConvoId] = useState<string | null>(null);

  const [profile, setProfile] = useState<{ name: string; email: string; hasPin: boolean; pinEnabled: boolean }>({
    name: 'Egie',
    email: 'egiegay08@gmail.com',
    hasPin: false,
    pinEnabled: false
  });
  const [isLocked, setIsLocked] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.pinEnabled && data.hasPin) {
          setIsLocked(true);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat profil');
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat daftar percakapan');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchConversations();
  }, []);

  const handleCreateChat = async (title: string, systemPrompt: string, mode: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, systemPrompt, mode })
      });
      const data = await res.json();
      await fetchConversations();
      setActiveId(data.id);
      setIsNewChatOpen(false);
      toast.success('Percakapan baru berhasil dibuat');
    } catch (e) {
      console.error(e);
      toast.error('Gagal membuat percakapan');
    }
  };

  const handleDeleteChatRequest = (id: string) => {
    setDeletingConvoId(id);
  };

  const confirmDeleteChat = async () => {
    if (!deletingConvoId) return;
    const id = deletingConvoId;
    setDeletingConvoId(null);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Percakapan berhasil dihapus');
        
        // Find remaining conversations
        const updated = conversations.filter(c => c.id !== id);
        setConversations(updated);

        if (activeId === id) {
          setActiveId(updated.length > 0 ? updated[0].id : null);
        }
      } else {
        toast.error('Gagal menghapus percakapan');
      }
    } catch (e) {
      toast.error('Gagal menghapus percakapan');
    }
  };

  const handleOpenEdit = (c: any) => {
    setEditingConvo(c);
    setIsEditModalOpen(true);
  };

  const handleSaveEditChat = async (id: string, title: string, systemPrompt: string, mode: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, systemPrompt, mode })
      });

      if (res.ok) {
        toast.success('Percakapan berhasil diperbarui');
        await fetchConversations();
      } else {
        toast.error('Gagal memperbarui percakapan');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat menyimpan');
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-white text-gray-900 font-sans overflow-hidden">
      <Toaster position="top-center" />

      {isLocked && (
        <LockScreen onUnlock={() => setIsLocked(false)} />
      )}

      <Sidebar 
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={() => setIsNewChatOpen(true)}
        onSettings={() => setIsSettingsOpen(true)}
        onDelete={handleDeleteChatRequest}
        onEdit={handleOpenEdit}
        onOpenProfile={() => setIsProfileOpen(true)}
        profile={profile}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col h-full min-w-0">
        <Chat activeId={activeId} onNewChat={() => setIsNewChatOpen(true)} />
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      <NewChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)}
        onCreate={handleCreateChat}
      />

      <EditChatModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        conversation={editingConvo}
        onSave={handleSaveEditChat}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          fetchProfile();
        }}
        onLockApp={() => setIsLocked(true)}
      />

      <ConfirmModal
        isOpen={!!deletingConvoId}
        title="Hapus Percakapan"
        message="Apakah Anda yakin ingin menghapus percakapan ini beserta seluruh riwayat pesan? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Percakapan"
        cancelText="Batal"
        onConfirm={confirmDeleteChat}
        onClose={() => setDeletingConvoId(null)}
      />
    </div>
  );
}
