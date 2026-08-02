import React, { useState } from 'react';
import { Plus, Settings, MessageSquare, Menu, MoreVertical, Edit2, Trash2, User, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export function Sidebar({ 
  conversations, 
  activeId, 
  onSelect, 
  onNew, 
  onSettings,
  onDelete,
  onEdit,
  onOpenProfile,
  profile,
  isOpen,
  setIsOpen
}: { 
  conversations: any[]; 
  activeId: string | null; 
  onSelect: (id: string) => void;
  onNew: () => void;
  onSettings: () => void;
  onDelete: (id: string) => void;
  onEdit: (c: any) => void;
  onOpenProfile: () => void;
  profile?: { name: string; email: string; hasPin: boolean };
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const displayName = profile?.name || 'Egie';
  const displayEmail = profile?.email || 'egiegay08@gmail.com';

  return (
    <>
      {/* Mobile toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border border-gray-200"
        onClick={() => setIsOpen(!isOpen)}
        title="Buka Menu Sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b border-gray-200 flex gap-2">
          <button 
            onClick={onNew}
            className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={16} /> Obrolan Baru
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-gray-400">
              Belum ada percakapan. Buat obrolan baru di atas.
            </div>
          ) : (
            conversations.map(c => (
              <div key={c.id} className="relative group flex items-center">
                <button
                  onClick={() => {
                    onSelect(c.id);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "flex-1 flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors text-left truncate pr-8",
                    activeId === c.id ? "bg-gray-200/80 text-black font-semibold shadow-xs" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <MessageSquare size={15} className="shrink-0 text-gray-500" />
                  <span className="truncate">{c.title}</span>
                </button>

                <div className="absolute right-1.5 flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === c.id ? null : c.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-200/80 transition-colors"
                    title="Menu Opsi"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {menuOpenId === c.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1 overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onEdit(c);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-100 flex items-center gap-2 text-gray-700 transition-colors"
                        >
                          <Edit2 size={14} /> Ubah Obrolan
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onDelete(c.id);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 flex flex-col gap-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gray-50/50">
          <button 
            onClick={onSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 rounded-xl hover:bg-gray-200/60 transition-colors text-left"
          >
            <Settings size={16} /> Pengaturan
          </button>
          
          <button
            onClick={onOpenProfile}
            className="w-full mt-1 pt-2 border-t border-gray-200/80 flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-gray-200/60 transition-colors text-left group"
            title="Kelola Profil & Keamanan"
          >
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0 uppercase group-hover:scale-105 transition-transform">
              {displayName.charAt(0)}
            </div>
            <div className="flex flex-col truncate flex-1 min-w-0">
              <span className="text-xs font-bold text-gray-900 truncate flex items-center gap-1">
                {displayName}
                {profile?.hasPin && <ShieldCheck size={12} className="text-green-600 shrink-0" />}
              </span>
              <span className="text-[10px] text-gray-500 truncate">{displayEmail}</span>
            </div>
            <User size={14} className="text-gray-400 group-hover:text-black shrink-0" />
          </button>
        </div>
      </div>
    </>
  );
}
