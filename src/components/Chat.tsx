import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, Loader2, Zap, Brain, MessageSquare, Copy, Edit3, Check, Mic, MicOff, Trash2, Volume2, RotateCcw, X, Plus, Layers, Cpu, Sparkles, BookOpen } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { ConfirmModal } from './ConfirmModal';
import { InstructionHierarchyModal } from './InstructionHierarchyModal';
import { TokenizerModal, estimateTokenCount } from './TokenizerModal';
import { MemoryModal } from './MemoryModal';
import { RagLibraryModal } from './RagLibraryModal';

const RECOMMENDATIONS = [
  {
    title: 'Ringkas teks kompleks',
    subtitle: 'Bantu saya memahami artikel panjang',
    prompt: 'Tolong ringkas teks berikut ini dan jelaskan poin-poin utamanya secara sederhana:\n\n'
  },
  {
    title: 'Jelaskan konsep',
    subtitle: 'Pahami topik yang rumit dengan analogi',
    prompt: 'Tolong jelaskan konsep [masukkan konsep] seolah-olah saya adalah pemula.'
  },
  {
    title: 'Bantu saya menulis',
    subtitle: 'Draf email atau laporan',
    prompt: 'Bantu saya menulis draf email profesional untuk [tujuan email] kepada [penerima].'
  },
  {
    title: 'Brainstorming ide',
    subtitle: 'Hasilkan ide kreatif untuk proyek',
    prompt: 'Berikan saya 5 ide kreatif untuk [topik proyek atau masalah].'
  }
];

export function Chat({ activeId, onNewChat }: { activeId: string | null; onNewChat?: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [mode, setMode] = useState<string>('fast');
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentTrace, setAgentTrace] = useState<{ id: string; step: string; details?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('nova');
  const [isPlayingAiVoice, setIsPlayingAiVoice] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [isTokenizerModalOpen, setIsTokenizerModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isRagModalOpen, setIsRagModalOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        if (vList && vList.length > 0) {
          setAvailableVoices(vList);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'id-ID';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast.error('Gagal mendeteksi suara');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      } else {
        recognitionRef.current?.stop();
      }
      setIsListening(false);
      return;
    }

    // Try MediaRecorder for AI Whisper voice transcription first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());

          if (audioBlob.size > 1000) {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'input.webm');
            toast.loading('Mengkonversi suara dengan AI Whisper...', { id: 'transcribe' });

            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
              });
              const data = await res.json();
              toast.dismiss('transcribe');
              if (data.text) {
                setInput(prev => prev ? `${prev} ${data.text}` : data.text);
                toast.success('Suara berhasil dikonversi');
              } else {
                toast.error('Suara tidak terdeteksi');
              }
            } catch (err) {
              toast.dismiss('transcribe');
              console.warn('Whisper error, fallback to Web Speech');
            }
          }
        };

        mediaRecorder.start();
        setIsListening(true);
        toast('Mendengarkan... Bicara sekarang', { icon: '🎙️' });
        return;
      } catch (e) {
        console.warn('Microphone stream error, fallback to Web Speech:', e);
      }
    }

    // Web Speech API fallback
    if (!recognitionRef.current) {
      toast.error('Browser tidak mendukung pengenalan suara');
      return;
    }
    setInput('');
    recognitionRef.current.start();
    setIsListening(true);
  };

  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (activeId) {
      fetch(`/api/conversations/${activeId}`)
        .then(r => r.json())
        .then(data => {
          setMode(data.mode || 'fast');
          setCurrentSystemPrompt(data.systemPrompt || '');
        });
        
      fetch(`/api/conversations/${activeId}/messages`)
        .then(r => r.json())
        .then(data => {
          setMessages(data.messages);
          setDocuments(data.documents);
        });
    } else {
      setMessages([]);
      setDocuments([]);
      setCurrentSystemPrompt('');
    }
  }, [activeId]);

  const handleUpdateSystemPrompt = async (newPrompt: string) => {
    if (!activeId) return;
    setCurrentSystemPrompt(newPrompt);
    try {
      await fetch(`/api/conversations/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Obrolan Active', // keeps title intact via PUT endpoint
          systemPrompt: newPrompt,
          mode
        })
      });
      toast.success('System Prompt (Level 1) diperbarui');
    } catch (e) {
      console.error(e);
      toast.error('Gagal memperbarui System Prompt');
    }
  };

  const handleModeChange = async (newMode: string) => {
    if (!activeId || newMode === mode) return;
    setMode(newMode);
    try {
      await fetch(`/api/conversations/${activeId}/mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
      toast.success(`Mode diubah ke ${newMode === 'fast' ? 'Cepat' : 'Berpikir'}`);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengubah mode');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamResponse = async (userPrompt: string, isRetry = false) => {
    if (!activeId || loading) return;
    setLoading(true);
    setAgentTrace([]);

    if (!isRetry && userPrompt) {
      setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    }
    
    // Placeholder message for assistant
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeId,
          content: userPrompt,
          stream: true,
          isRetry
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal mengirim pesan');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.agentTrace) {
                  setAgentTrace(prev => [...prev, parsed.agentTrace]);
                } else if (parsed.chunk) {
                  accumulated += parsed.chunk;
                  
                  // Phase 2: Intelligence Layer - Clean display output
                  const cleanText = (text: string) => {
                    return text
                      .replace(/<think>[\s\S]*?(<\/think>|$)/gi, '')
                      .replace(/(Pemikiran Analitis|Thinking Phase|Real-Time Thinking|Proses Berpikir)[\s\S]*?(---|$)/gi, '')
                      .trim();
                  };

                  setMessages(prev => {
                    const updated = [...prev];
                    if (updated.length > 0) {
                      updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        content: cleanText(accumulated)
                      };
                    }
                    return updated;
                  });
                } else if (parsed.error) {
                  toast.error(parsed.error);
                }
              } catch (e) {
                // Ignore chunk parse error
              }
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengirim pesan');
    } finally {
      setLoading(false);
      // Re-sync messages to assign database IDs to newly created messages
      if (activeId) {
        try {
          const res = await fetch(`/api/conversations/${activeId}/messages`);
          const data = await res.json();
          if (data.messages) setMessages(data.messages);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeId || loading) return;
    const text = input;
    setInput('');
    await streamResponse(text, false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', activeId);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => [...prev, { id: data.id, filename: data.filename }]);
        toast.success(`File ${file.name} berhasil diunggah`);
      } else {
        toast.error(data.error || 'Gagal mengunggah file');
      }
    } catch (err) {
      toast.error('Unggahan gagal');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    toast.success('Disalin ke papan klip');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = (content: string) => {
    setInput(content);
    toast.success('Pesan disalin ke kotak input');
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        toast.success('Dokumen berhasil dihapus');
      } else {
        toast.error('Gagal menghapus dokumen');
      }
    } catch (e) {
      toast.error('Gagal menghapus dokumen');
    }
  };

  const handleDeleteMessage = async (msgId: string, index: number) => {
    let targetId = msgId;
    if (!targetId && messages[index]?.id) {
      targetId = messages[index].id;
    }

    if (targetId) {
      try {
        const res = await fetch(`/api/messages/${targetId}`, { method: 'DELETE' });
        if (!res.ok) {
          toast.error('Gagal menghapus pesan dari server');
          return;
        }
      } catch (e) {
        console.error(e);
        toast.error('Gagal menghapus pesan');
        return;
      }
    }
    setMessages(prev => prev.filter((_, i) => i !== index));
    toast.success('Pesan berhasil dihapus');
  };

  const handleClearHistoryConfirm = async () => {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        toast.success('Riwayat berhasil dibersihkan');
      } else {
        toast.error('Gagal membersihkan riwayat');
      }
    } catch (e) {
      toast.error('Gagal membersihkan riwayat');
    }
  };

  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
      .replace(/```[\s\S]*?```/g, ' Kode program. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/#+\s+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[-*+]\s+/g, '')
      .replace(/\d+\.\s+/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getIndonesianVoice = (): SpeechSynthesisVoice | null => {
    const vList = availableVoices.length > 0 
      ? availableVoices 
      : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

    if (!vList || vList.length === 0) return null;

    let v = vList.find(x => x.lang === 'id-ID' || x.lang === 'id_ID');
    if (v) return v;
    v = vList.find(x => x.lang.toLowerCase().startsWith('id') || x.lang.toLowerCase().includes('indonesia'));
    if (v) return v;
    v = vList.find(x => x.name.toLowerCase().includes('indonesia') || x.name.toLowerCase().includes('gadis') || x.name.toLowerCase().includes('ardi'));
    return v || null;
  };

  const splitIntoSentenceChunks = (text: string): string[] => {
    const sentences = text.match(/[^.!?;]+[.!?;]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 160) {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    return chunks.length > 0 ? chunks : [text];
  };

  const handleSpeak = async (text: string, index: number) => {
    if (speakingIdx === index) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingIdx(null);
      setIsPlayingAiVoice(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      toast.error('Tidak ada teks yang dapat dibaca');
      return;
    }

    setSpeakingIdx(index);
    setIsPlayingAiVoice(true);

    // 1. Try AI TTS with hcnsec provider models
    try {
      toast.loading(`Menyiapkan suara AI (${selectedVoice})...`, { id: 'tts' });
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: selectedVoice, model: 'tts-1' })
      });

      toast.dismiss('tts');

      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 500) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onended = () => {
            setSpeakingIdx(null);
            setIsPlayingAiVoice(false);
            URL.revokeObjectURL(audioUrl);
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            fallbackWebSpeech(cleanText, index);
          };

          try {
            await audio.play();
            toast.success(`Memutar Suara AI (${selectedVoice})`);
            return;
          } catch (playErr) {
            console.warn('audio.play() rejected:', playErr);
            audioRef.current = null;
          }
        }
      }
    } catch (err) {
      toast.dismiss('tts');
      console.warn('AI TTS fetch error, fallback to Web Speech:', err);
    }

    // 2. Fallback to natural Web Speech API
    fallbackWebSpeech(cleanText, index);
  };

  const fallbackWebSpeech = (cleanedText: string, index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Gagal memutar suara di browser');
      setSpeakingIdx(null);
      setIsPlayingAiVoice(false);
      return;
    }

    const chunks = splitIntoSentenceChunks(cleanedText);
    const bestVoice = getIndonesianVoice();

    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    let chunkIndex = 0;

    const playNextChunk = () => {
      if (chunkIndex >= chunks.length) {
        setSpeakingIdx(null);
        setIsPlayingAiVoice(false);
        return;
      }

      const chunkText = chunks[chunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = 'id-ID';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onend = () => {
        chunkIndex++;
        playNextChunk();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis chunk error:', e);
        chunkIndex++;
        if (chunkIndex < chunks.length) {
          playNextChunk();
        } else {
          setSpeakingIdx(null);
          setIsPlayingAiVoice(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    playNextChunk();
    toast('Memutar Suara Bahasa Indonesia (id-ID)', { icon: '🔊' });
  };

  const handleRegenerate = async () => {
    if (!activeId || loading || messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    await streamResponse(lastUserMsg.content, true);
  };

  if (!activeId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
        <MessageSquare size={48} className="mb-4 text-gray-300" />
        <p className="text-base font-medium text-gray-700 mb-1">Belum ada percakapan aktif</p>
        <p className="text-sm text-gray-400 mb-6">Pilih percakapan dari menu samping atau mulai yang baru.</p>
        {onNewChat && (
          <button 
            onClick={onNewChat}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Buat Obrolan Baru
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header showing mode and attached docs */}
      <div className="bg-gray-50 border-b border-gray-100 p-3 md:p-4 pl-16 md:pl-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-gray-200/50 p-1 rounded-lg flex inline-flex text-xs font-medium">
            <button 
              onClick={() => handleModeChange('fast')}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors", mode === 'fast' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700")}
            >
              <Zap size={14} /> Cepat
            </button>
            <button 
              onClick={() => handleModeChange('thinking')}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors", mode === 'thinking' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700")}
            >
              <Brain size={14} /> Berpikir
            </button>
          </div>

          <div className="bg-gray-200/50 p-1 rounded-lg flex items-center gap-1 text-xs font-medium">
            <Volume2 size={13} className="text-gray-500 ml-1 shrink-0" />
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-transparent text-gray-700 outline-none cursor-pointer py-1 pr-1 font-medium text-xs"
              title="Pilih Karakter Suara AI"
            >
              <option value="nova">Suara: Nova (Wanita Natural)</option>
              <option value="alloy">Suara: Alloy (Netral)</option>
              <option value="echo">Suara: Echo (Pria)</option>
              <option value="fable">Suara: Fable (Ekspresif)</option>
              <option value="onyx">Suara: Onyx (Pria Berat)</option>
              <option value="shimmer">Suara: Shimmer (Hangat)</option>
            </select>
          </div>

          {/* AI System Tools Dropdown Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-lg shadow-2xs hover:bg-gray-50 transition-colors"
              title="Akses Alat Inspeksi & Sistem AI (Hirarki, Tokenizer, Memori, RAG)"
            >
              <Sparkles size={13} className="text-gray-900" />
              <span className="hidden sm:inline">Fitur AI</span>
            </button>

            {isToolsMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsToolsMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1 space-y-0.5 animate-fadeIn">
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsInstructionModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <Layers size={14} className="text-gray-800 shrink-0" />
                    <span>Hirarki Instruksi</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsTokenizerModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <Cpu size={14} className="text-gray-800 shrink-0" />
                    <span>LLM Tokenizer</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsMemoryModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <Brain size={14} className="text-gray-800 shrink-0" />
                    <span>Memori Pengguna</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsRagModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <BookOpen size={14} className="text-gray-800 shrink-0" />
                    <span>Perpustakaan RAG Kitab</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {documents.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {documents.map(d => (
                <div key={d.id} className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 shadow-sm">
                  <FileText size={14} />
                  <span className="truncate max-w-[120px]">{d.filename}</span>
                  <button 
                    onClick={() => handleDeleteDocument(d.id)}
                    className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Hapus dokumen"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsConfirmClearOpen(true)}
              className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-gray-200/60 transition-colors text-xs flex items-center gap-1"
              title="Bersihkan riwayat pesan"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Bersihkan</span>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 md:py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Brain size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium text-gray-800 mb-2">Bagaimana saya bisa membantu Anda hari ini?</h3>
            <p className="text-sm md:text-base text-gray-500 mb-8 max-w-md">Saya siap membantu Anda belajar, menyintesis informasi kompleks, atau berdiskusi mengenai berbagai topik.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
              {RECOMMENDATIONS.map((rec, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(rec.prompt)}
                  className="flex flex-col text-left p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-sm text-gray-800 mb-1">{rec.title}</span>
                  <span className="text-xs text-gray-500">{rec.subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex gap-4 max-w-3xl mx-auto group", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx(
              "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              m.role === 'user' ? "bg-gray-200 text-gray-700" : "bg-black text-white"
            )}>
              {m.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className="flex flex-col gap-1 w-full max-w-[85%] md:max-w-[75%]">
              <div className={clsx(
                "px-4 py-3 rounded-lg w-fit",
                m.role === 'user' ? "bg-gray-100 text-gray-900 rounded-tr-none self-end" : "bg-white border border-gray-200 text-gray-900 rounded-tl-none shadow-sm"
              )}>
                <div className="prose prose-sm md:prose-base prose-gray max-w-none break-words overflow-x-auto">
                  <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                </div>
              </div>
              {m.role === 'assistant' && m.content && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 pl-1">
                  <span>⚡ ~{estimateTokenCount(m.content).tokens} tokens</span>
                </div>
              )}
              <div className={clsx(
                "flex items-center gap-1.5 mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                m.role === 'user' ? "self-end" : "self-start"
              )}>
                <button 
                  onClick={() => handleCopy(m.content, i)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  title="Salin teks"
                >
                  {copiedId === i ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
                {m.role === 'assistant' && (
                  <button 
                    onClick={() => handleSpeak(m.content, i)}
                    className={clsx(
                      "p-1.5 rounded-md transition-colors",
                      speakingIdx === i ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100"
                    )}
                    title="Dengarkan suara"
                  >
                    <Volume2 size={14} />
                  </button>
                )}
                {m.role === 'user' && (
                  <button 
                    onClick={() => handleRetry(m.content)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    title="Salin ke kotak input"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteMessage(m.id, i)}
                  className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  title="Hapus pesan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {messages.length > 0 && !loading && (
          <div className="flex justify-center max-w-3xl mx-auto pt-2">
            <button 
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-black bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw size={13} /> Buat Ulang Jawaban
            </button>
          </div>
        )}
        {loading && (
          <div className="flex flex-col gap-2 max-w-3xl mx-auto">
            {agentTrace.length > 0 && (
              <div className="flex flex-col gap-2 px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-100 animate-fadeIn shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu size={10} /> Agent Controller Trace
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    ID: {agentTrace[0]?.id}
                  </span>
                </div>
                <div className="space-y-2">
                  {agentTrace.map((trace, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs group">
                      <div className="mt-0.5 shrink-0">
                        {idx === agentTrace.length - 1 ? (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
                        ) : (
                          <Check size={14} className="text-gray-900" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{trace.step}</span>
                        {trace.details && <span className="text-[11px] text-gray-500">{trace.details}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3 items-center text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-sm animate-pulse">
              <div className="shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                {mode === 'thinking' ? <Brain size={14} className="animate-spin" /> : <Zap size={14} className="animate-pulse" />}
              </div>
              <span>
                {mode === 'thinking' 
                  ? 'Mode Berpikir: Menganalisis & menyusun respons real-time...' 
                  : 'Mengetik respons real-time...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4 border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
          <label className="cursor-pointer p-2 text-gray-500 hover:text-black shrink-0 relative">
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "Mendengarkan..." : "Ketik pesan..."}
            className="flex-1 max-h-32 bg-transparent resize-none outline-none py-2 px-1 placeholder-gray-400"
            rows={1}
            style={{ minHeight: '40px' }}
          />
          {input.trim().length > 0 && (
            <button
              onClick={() => setIsTokenizerModalOpen(true)}
              className="text-[10px] font-mono text-gray-400 hover:text-cyan-700 bg-gray-100 hover:bg-cyan-50 px-2 py-1 rounded-md transition-colors self-center shrink-0 mb-0.5"
              title="Klik untuk inspeksi token"
            >
              ~{estimateTokenCount(input).tokens} tkn
            </button>
          )}
          <button
            onClick={toggleListening}
            className={clsx(
              "p-2 rounded-lg shrink-0 mb-0.5 transition-colors",
              isListening ? "text-white bg-red-500 hover:bg-red-600 animate-pulse" : "text-gray-500 hover:text-black hover:bg-gray-200"
            )}
            title="Dikte suara"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-400 shrink-0 mb-0.5"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          AI bisa melakukan kesalahan. Pastikan untuk memverifikasi informasi penting.
        </p>
      </div>

      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title="Bersihkan Riwayat Pesan"
        message="Apakah Anda yakin ingin menghapus seluruh riwayat pesan dalam percakapan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Bersihkan Riwayat"
        cancelText="Batal"
        onConfirm={handleClearHistoryConfirm}
        onClose={() => setIsConfirmClearOpen(false)}
      />

      <InstructionHierarchyModal
        isOpen={isInstructionModalOpen}
        onClose={() => setIsInstructionModalOpen(false)}
        conversationId={activeId}
        currentSystemPrompt={currentSystemPrompt}
        onUpdateSystemPrompt={handleUpdateSystemPrompt}
      />

      <TokenizerModal
        isOpen={isTokenizerModalOpen}
        onClose={() => setIsTokenizerModalOpen(false)}
        initialText={input}
      />

      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        activeConversationId={activeId}
      />

      <RagLibraryModal
        isOpen={isRagModalOpen}
        onClose={() => setIsRagModalOpen(false)}
      />
    </div>
  );
}

// Needed because I used MessageSquare in empty state
