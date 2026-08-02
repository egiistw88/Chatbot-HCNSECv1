import React, { useState, useEffect } from 'react';
import { X, BookOpen, Plus, Trash2, Search, FileText, Upload, Database, Layers, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  title: string;
  author: string;
  category: string;
  content: string;
  version: string;
  sourceType: string;
  chunkCount: number;
  createdAt: number;
}

interface SearchChunkResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentAuthor: string;
  documentCategory: string;
  chunkIndex: number;
  content: string;
  score: number;
}

interface RagLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RagLibraryModal({ isOpen, onClose }: RagLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'playground'>('library');
  
  // Data States
  const [libraries, setLibraries] = useState<KnowledgeBase[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(false);

  // New Library Form
  const [newLibName, setNewLibName] = useState('');
  const [newLibDesc, setNewLibDesc] = useState('');
  const [showAddLibForm, setShowAddLibForm] = useState(false);

  // New Document Form
  const [docTitle, setDocTitle] = useState('');
  const [docAuthor, setDocAuthor] = useState('');
  const [docCategory, setDocCategory] = useState('');
  const [docVersion, setDocVersion] = useState('1.0');
  const [docSourceType, setDocSourceType] = useState('manual');
  const [docContent, setDocContent] = useState('');
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [showAddDocForm, setShowAddDocForm] = useState(false);

  // Playground Search State
  const [testQuery, setTestQuery] = useState('Apa hukum air musta\'mal menurut Hanafi?');
  const [searchResults, setSearchResults] = useState<SearchChunkResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchLibraries = async () => {
    try {
      const res = await fetch('/api/rag/libraries');
      if (res.ok) {
        const data = await res.json();
        setLibraries(data);
        if (data.length > 0 && !selectedLibraryId) {
          setSelectedLibraryId(data[0].id);
        }
      }
    } catch (e) {
      toast.error('Gagal memuat perpustakaan RAG');
    }
  };

  const fetchDocuments = async (kbId?: string) => {
    setLoading(true);
    try {
      const targetId = kbId || selectedLibraryId;
      const url = targetId ? `/api/rag/documents?knowledgeBaseId=${targetId}` : '/api/rag/documents';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      toast.error('Gagal memuat kitab/dokumen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLibraries();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedLibraryId) {
      fetchDocuments(selectedLibraryId);
    }
  }, [selectedLibraryId, isOpen]);

  if (!isOpen) return null;

  const handleCreateLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibName.trim()) {
      toast.error('Nama koleksi tidak boleh kosong');
      return;
    }

    try {
      const res = await fetch('/api/rag/libraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLibName.trim(), description: newLibDesc.trim() })
      });

      if (res.ok) {
        toast.success('Koleksi baru dibuat');
        setNewLibName('');
        setNewLibDesc('');
        setShowAddLibForm(false);
        fetchLibraries();
      }
    } catch (e) {
      toast.error('Gagal membuat koleksi');
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibraryId) {
      toast.error('Pilih koleksi terlebih dahulu');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('knowledgeBaseId', selectedLibraryId);
      formData.append('title', docTitle);
      formData.append('author', docAuthor);
      formData.append('category', docCategory);
      formData.append('version', docVersion);
      formData.append('sourceType', docSourceType);
      
      if (fileUpload) {
        formData.append('file', fileUpload);
      } else {
        if (!docTitle.trim() || !docContent.trim()) {
          toast.error('Isi judul dan konten teks');
          return;
        }
        formData.append('content', docContent);
      }

      toast.loading('Memproses dokumen...', { id: 'add-doc' });
      const res = await fetch('/api/rag/documents', {
        method: 'POST',
        body: formData
      });

      toast.dismiss('add-doc');

      if (res.ok) {
        toast.success('Dokumen disimpan');
        setDocTitle('');
        setDocAuthor('');
        setDocCategory('');
        setDocVersion('1.0');
        setDocSourceType('manual');
        setDocContent('');
        setFileUpload(null);
        setShowAddDocForm(false);
        fetchDocuments();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Gagal menyimpan dokumen');
      }
    } catch (e) {
      toast.dismiss('add-doc');
      toast.error('Terjadi kesalahan saat menambahkan dokumen');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await fetch(`/api/rag/documents/${id}`, { method: 'DELETE' });
      toast.success('Dokumen dihapus');
      fetchDocuments();
    } catch (e) {
      toast.error('Gagal menghapus dokumen');
    }
  };

  const handleSearchPlayground = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testQuery.trim()) {
      toast.error('Masukkan kata kunci pencarian');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery.trim(), knowledgeBaseId: selectedLibraryId, topK: 5 })
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        toast.error('Gagal melakukan pencarian');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan pencarian');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Perpustakaan Kitab (RAG)</h2>
              <p className="text-xs text-gray-500">Kelola dokumen rujukan yang otomatis digunakan AI saat menjawab</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Tabs */}
        <div className="flex border-b border-gray-100 px-6 gap-4 text-xs font-medium text-gray-500 bg-white">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'border-gray-900 text-gray-900 font-semibold'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-gray-800" />
            Koleksi Dokumen
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'playground'
                ? 'border-gray-900 text-gray-900 font-semibold'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-gray-800" />
            Uji Pencarian
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Controls Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-gray-50/70 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-gray-700 shrink-0">Koleksi:</span>
                  <select
                    value={selectedLibraryId}
                    onChange={(e) => setSelectedLibraryId(e.target.value)}
                    className="text-xs p-2 border border-gray-200 rounded-lg bg-white font-medium focus:outline-none flex-1"
                  >
                    {libraries.map(lib => (
                      <option key={lib.id} value={lib.id}>{lib.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setShowAddDocForm(!showAddDocForm)}
                    className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium flex items-center gap-1 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Kitab
                  </button>
                  <button
                    onClick={() => setShowAddLibForm(!showAddLibForm)}
                    className="px-2.5 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Koleksi Baru
                  </button>
                </div>
              </div>

              {/* Form Add Library */}
              {showAddLibForm && (
                <form onSubmit={handleCreateLibrary} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2.5 animate-fadeIn">
                  <h3 className="text-xs font-semibold text-gray-900">Buat Koleksi Baru</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Koleksi..."
                      value={newLibName}
                      onChange={(e) => setNewLibName(e.target.value)}
                      className="text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Deskripsi singkat..."
                      value={newLibDesc}
                      onChange={(e) => setNewLibDesc(e.target.value)}
                      className="text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowAddLibForm(false)}
                      className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-gray-900 text-white text-xs rounded-lg font-medium"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              )}

              {/* Form Add Document */}
              {showAddDocForm && (
                <form onSubmit={handleAddDocument} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2.5 animate-fadeIn">
                  <h3 className="text-xs font-semibold text-gray-900">Tambah Kitab / Dokumen Baru</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Judul Kitab..."
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Penulis..."
                      value={docAuthor}
                      onChange={(e) => setDocAuthor(e.target.value)}
                      className="text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Kategori..."
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Versi..."
                      value={docVersion}
                      onChange={(e) => setDocVersion(e.target.value)}
                      className="text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                    />
                    <select
                      value={docSourceType}
                      onChange={(e) => setDocSourceType(e.target.value)}
                      className="text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="manual">Manual</option>
                      <option value="upload">Upload</option>
                      <option value="web">Web Scrape</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> File (.pdf/.txt) atau masukkan teks:
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => setFileUpload(e.target.files ? e.target.files[0] : null)}
                      className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200"
                    />
                  </div>

                  {!fileUpload && (
                    <textarea
                      rows={4}
                      placeholder="Tempelkan isi teks kitab di sini..."
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none font-mono"
                    />
                  )}

                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowAddDocForm(false)}
                      className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 bg-gray-900 text-white text-xs rounded-lg font-medium"
                    >
                      Proses &amp; Simpan
                    </button>
                  </div>
                </form>
              )}

              {/* Document List */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-800">
                  Daftar Kitab ({documents.length}):
                </h3>

                {loading ? (
                  <div className="py-8 text-center text-xs text-gray-400">Memuat daftar kitab...</div>
                ) : documents.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <BookOpen className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-500 font-medium">Belum ada dokumen di koleksi ini</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-gray-900 truncate">{doc.title}</h4>
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded shrink-0">
                              {doc.category || 'Umum'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">Penulis: {doc.author || 'Anonim'} | v{doc.version || '1.0'}</p>
                          <p className="text-[11px] text-gray-600 line-clamp-2 mt-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100 font-mono">
                            {doc.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 text-[10px] text-gray-400 font-mono">
                          <span>{doc.chunkCount} chunk</span>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded"
                            title="Hapus kitab"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'playground' && (
            <div className="space-y-4">
              {/* Search Box */}
              <form onSubmit={handleSearchPlayground} className="space-y-2 p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                <label className="text-xs font-semibold text-gray-900 block">
                  Uji Pertanyaan ke Database Kitab:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Contoh: Apa hukum air musta'mal menurut Hanafi?"
                    className="flex-1 text-xs p-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-3.5 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Cari
                  </button>
                </div>
              </form>

              {/* Search Results */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-900">
                  Potongan Teks Kitab Terambil:
                </h3>

                {searching ? (
                  <div className="py-8 text-center text-xs text-gray-400">Mencari referensi...</div>
                ) : searchResults.length === 0 ? (
                  hasSearched ? (
                    <div className="py-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-xs text-gray-500">
                      Tidak ada rujukan kitab yang cocok.
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400">Tekan "Cari" untuk menguji RAG.</div>
                  )
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((res, i) => (
                      <div key={res.chunkId} className="p-3 border border-gray-200 rounded-xl bg-white space-y-1.5">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-xs font-semibold text-gray-900">
                            #{i + 1} Kitab "{res.documentTitle}" ({res.documentAuthor})
                          </span>
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            Skor: {res.score}
                          </span>
                        </div>

                        <p className="text-xs text-gray-800 font-mono leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100 whitespace-pre-wrap">
                          {res.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-800" />
            Terhubung dengan AI Chat
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

