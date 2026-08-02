import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || '01234567890123456789012345678901'; // Must be 32 chars
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

let db: any;

export async function initDb() {
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(path.join(dbDir, 'database.sqlite'));

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      system_prompt TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT,
      role TEXT,
      content TEXT,
      created_at INTEGER,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      conversation_id TEXT,
      filename TEXT,
      content TEXT,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      type TEXT, -- preference, fact, project_context, etc.
      category TEXT,
      content TEXT,
      confidence REAL DEFAULT 1.0,
      source TEXT,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id TEXT PRIMARY KEY,
      knowledge_base_id TEXT,
      title TEXT,
      author TEXT,
      category TEXT,
      content TEXT,
      version TEXT,
      source_type TEXT,
      created_at INTEGER,
      FOREIGN KEY(knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT,
      chunk_index INTEGER,
      content TEXT,
      FOREIGN KEY(document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
    );
  `);

  try {
    db.exec(`ALTER TABLE memories ADD COLUMN type TEXT;`);
    db.exec(`ALTER TABLE memories ADD COLUMN confidence REAL DEFAULT 1.0;`);
    db.exec(`ALTER TABLE memories ADD COLUMN source TEXT;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE knowledge_documents ADD COLUMN version TEXT;`);
    db.exec(`ALTER TABLE knowledge_documents ADD COLUMN source_type TEXT;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE conversations ADD COLUMN mode TEXT;`);
  } catch (e) {
    // Ignore error if column already exists
  }

  // Seed Default RAG Knowledge Library if empty
  await seedDefaultKnowledgeBase();
}

export async function getSetting(key: string): Promise<string | null> {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  if (row) {
    try {
      return decrypt(row.value);
    } catch (e) {
      return row.value; // Fallback for unencrypted
    }
  }
  return null;
}

export async function setSetting(key: string, value: string) {
  const encrypted = encrypt(value);
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, encrypted);
}

export async function getConversations() {
  const rows = db.prepare('SELECT id, title, system_prompt, created_at, mode FROM conversations ORDER BY created_at DESC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    title: decrypt(r.title),
    systemPrompt: r.system_prompt ? decrypt(r.system_prompt) : null,
    createdAt: r.created_at,
    mode: r.mode ? decrypt(r.mode) : 'fast'
  }));
}

export async function getConversation(id: string) {
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    title: decrypt(row.title),
    systemPrompt: row.system_prompt ? decrypt(row.system_prompt) : null,
    createdAt: row.created_at,
    mode: row.mode ? decrypt(row.mode) : 'fast'
  };
}

export async function createConversation(id: string, title: string, systemPrompt?: string, mode?: string) {
  db.prepare('INSERT INTO conversations (id, title, system_prompt, created_at, mode) VALUES (?, ?, ?, ?, ?)').run(
    id,
    encrypt(title),
    systemPrompt ? encrypt(systemPrompt) : null,
    Date.now(),
    mode ? encrypt(mode) : null
  );
}

export async function updateConversationMode(id: string, mode: string) {
  db.prepare('UPDATE conversations SET mode = ? WHERE id = ?').run(encrypt(mode), id);
}

export async function updateConversationTitle(id: string, title: string) {
  db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(encrypt(title), id);
}

export async function updateConversationDetails(id: string, title: string, systemPrompt?: string, mode?: string) {
  db.prepare('UPDATE conversations SET title = ?, system_prompt = ?, mode = ? WHERE id = ?').run(
    encrypt(title),
    systemPrompt ? encrypt(systemPrompt) : null,
    mode ? encrypt(mode) : 'fast',
    id
  );
}

export async function deleteConversation(id: string) {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
  db.prepare('DELETE FROM documents WHERE conversation_id = ?').run(id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
}

export async function deleteDocument(id: string) {
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

export async function deleteMessage(id: string) {
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}

export async function clearMessages(conversationId: string) {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
}

export async function getMessages(conversationId: string) {
  const rows = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId) as any[];
  return rows.map(r => ({
    id: r.id,
    role: decrypt(r.role),
    content: decrypt(r.content),
    createdAt: r.created_at
  }));
}

export async function addMessage(id: string, conversationId: string, role: string, content: string) {
  db.prepare('INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    conversationId,
    encrypt(role),
    encrypt(content),
    Date.now()
  );
}

export async function addDocument(id: string, conversationId: string, filename: string, content: string) {
  db.prepare('INSERT INTO documents (id, conversation_id, filename, content) VALUES (?, ?, ?, ?)').run(
    id,
    conversationId,
    encrypt(filename),
    encrypt(content)
  );
}

export async function getDocuments(conversationId: string) {
  const rows = db.prepare('SELECT * FROM documents WHERE conversation_id = ?').all(conversationId) as any[];
  return rows.map(r => ({
    id: r.id,
    filename: decrypt(r.filename),
    content: decrypt(r.content)
  }));
}

export async function getMemories() {
  const rows = db.prepare('SELECT * FROM memories ORDER BY created_at DESC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    type: r.type ? decrypt(r.type) : 'fact',
    category: r.category ? decrypt(r.category) : 'general',
    content: decrypt(r.content),
    confidence: r.confidence || 1.0,
    source: r.source ? decrypt(r.source) : 'conversation',
    enabled: r.enabled === 1,
    createdAt: r.created_at
  }));
}

export async function getActiveMemories() {
  const rows = db.prepare('SELECT * FROM memories WHERE enabled = 1 ORDER BY created_at DESC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    type: r.type ? decrypt(r.type) : 'fact',
    category: r.category ? decrypt(r.category) : 'general',
    content: decrypt(r.content),
    confidence: r.confidence || 1.0,
    source: r.source ? decrypt(r.source) : 'conversation',
    enabled: true,
    createdAt: r.created_at
  }));
}

export async function addMemory(id: string, type: string, category: string, content: string, confidence: number = 1.0, source: string = 'conversation', enabled: boolean = true) {
  db.prepare('INSERT INTO memories (id, type, category, content, confidence, source, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id,
    encrypt(type || 'fact'),
    encrypt(category || 'general'),
    encrypt(content),
    confidence,
    encrypt(source || 'conversation'),
    enabled ? 1 : 0,
    Date.now()
  );
}

export async function updateMemory(id: string, type: string, category: string, content: string, confidence: number, source: string, enabled: boolean) {
  db.prepare('UPDATE memories SET type = ?, category = ?, content = ?, confidence = ?, source = ?, enabled = ? WHERE id = ?').run(
    encrypt(type || 'fact'),
    encrypt(category || 'general'),
    encrypt(content),
    confidence,
    encrypt(source || 'conversation'),
    enabled ? 1 : 0,
    id
  );
}

export async function toggleMemory(id: string, enabled: boolean) {
  db.prepare('UPDATE memories SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
}

export async function deleteMemory(id: string) {
  db.prepare('DELETE FROM memories WHERE id = ?').run(id);
}

// --- RAG KNOWLEDGE BASE SYSTEM ---

export function chunkText(text: string, chunkSize = 400, overlap = 80): string[] {
  if (!text || !text.trim()) return [];
  const cleanText = text.trim();
  if (cleanText.length <= chunkSize) return [cleanText];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < cleanText.length) {
      // Find sentence or paragraph boundary
      const lastPeriod = cleanText.lastIndexOf('.', endIndex);
      const lastNewline = cleanText.lastIndexOf('\n', endIndex);
      const boundary = Math.max(lastPeriod, lastNewline);
      if (boundary > startIndex + 100) {
        endIndex = boundary + 1;
      }
    } else {
      endIndex = cleanText.length;
    }

    const chunk = cleanText.substring(startIndex, endIndex).trim();
    if (chunk) chunks.push(chunk);

    startIndex = endIndex - overlap;
    if (startIndex >= cleanText.length - overlap) break;
  }

  return chunks;
}

export async function seedDefaultKnowledgeBase() {
  const existingKbs = db.prepare('SELECT COUNT(*) as count FROM knowledge_bases').get() as any;
  if (existingKbs && existingKbs.count > 0) return;

  const kbId = 'kb-kitab-turats';
  const now = Date.now();

  db.prepare('INSERT INTO knowledge_bases (id, name, description, created_at) VALUES (?, ?, ?, ?)').run(
    kbId,
    encrypt('Library Kitab & Fiqh Islam'),
    encrypt('Perpustakaan rujukan kitab klasik (Nur al-Idah, Ihya Ulumuddin, Tafsir Ibn Katsir) untuk RAG Engine'),
    now
  );

  const books = [
    {
      id: 'doc-nur-al-idah',
      title: 'Nur al-Idah',
      author: 'Hasan Shurunbulali',
      category: 'Fiqh Hanafi',
      content: `[Kitab Nur al-Idah - Hasan Shurunbulali - Fiqh Hanafi]
Bab Thaharah & Hukum Air Musta'mal:
Menurut Madhhab Hanafi (Imam Abu Hanifah, Abu Yusuf, dan Muhammad al-Shaybani), Air Musta'mal (ماء مستعمل) adalah air yang telah digunakan untuk bersuci mengangkat hadats (seperti wudhu atau mandi wajib) atau digunakan pada badan dengan niat ibadah.

Hukum Air Musta'mal menurut Madhhab Hanafi:
1. Status Kesucian: Air musta'mal berstatus Suci tetapi tidak dapat menyucikan kembali (طاهر غير مطهر) - Thahir Ghairu Muthahhir.
2. Penggunaan: Air ini suci untuk diminum atau mencuci pakaian terkena najis, tetapi TIDAK sah digunakan untuk wudhu kedua kali atau mandi wajib lagi.
3. Kapan menjadi Musta'mal: Air berubah menjadi musta'mal seketika setelah menetes dan terpisah dari anggota tubuh pengguna.
4. Pandangan Riwayat Imam Abu Hanifah: Dalam riwayat paling rajih (al-Zahir al-Riwayah), statusnya adalah suci (thahir), tidak najis.`
    },
    {
      id: 'doc-ihya-ulumuddin',
      title: 'Ihya Ulumuddin',
      author: 'Imam Al-Ghazali',
      category: 'Tasawuf & Fiqh',
      content: `[Kitab Ihya Ulumuddin - Imam Al-Ghazali - Asrar al-Thaharah]
Kitab Rahasia Thaharah (Bersuci) & Kebersihan Jiwa:
Thaharah memiliki 4 tingkatan:
Tingkat 1: Menyucikan lahiriah dari hadats, najis, dan kotoran fisik menggunakan air suci.
Tingkat 2: Menyucikan anggota tubuh dari perbuatan dosa dan maksiat.
Tingkat 3: Menyucikan hati dari akhlak tercela dan sifat-sifat cela (al-Akhlaq al-Madhmumah).
Tingkat 4: Menyucikan rahasia batin (sirr) dari selain Allah SWT.

Mengenai air: Air adalah media penyucian fisik terbesar. Menyucikan tubuh dengan air suci mengingatkan hamba akan perlunya menyucikan batin dengan taubat dan istighfar.`
    },
    {
      id: 'doc-tafsir-ibn-katsir',
      title: 'Tafsir Ibn Katsir',
      author: 'Ismail ibn Katsir',
      category: 'Tafsir Al-Qur\'an',
      content: `[Tafsir Ibn Katsir - Surah Al-Ma'idah Ayah 6]
Tafsir Ayat Wudhu:
"Wahai orang-orang yang beriman! Apabila kamu hendak melaksanakan shalat, maka basuhlah wajahmu dan tanganmu sampai ke siku, dan sapulah kepalamu dan (basuh) kedua kakimu sampai ke kedua mata kaki..."

Penjelasan Fiqh Ayat Wudhu:
Ayat ini merupakan dalil kewajiban Thaharah sebelum shalat. Syarat air yang digunakan adalah air mutlaq (air murni dari langit atau bumi yang belum berubah sifatnya oleh najis atau penggunaan sebelumnya). Hukum air bersuci harus memenuhi sifat Thahir Muthahhir (Suci dan Menyucikan).`
    }
  ];

  for (const book of books) {
    db.prepare('INSERT INTO knowledge_documents (id, knowledge_base_id, title, author, category, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      book.id,
      kbId,
      encrypt(book.title),
      encrypt(book.author),
      encrypt(book.category),
      encrypt(book.content),
      now
    );

    const chunks = chunkText(book.content);
    chunks.forEach((chunkStr, idx) => {
      const chunkId = `${book.id}-c${idx}`;
      db.prepare('INSERT INTO knowledge_chunks (id, document_id, chunk_index, content) VALUES (?, ?, ?, ?)').run(
        chunkId,
        book.id,
        idx,
        encrypt(chunkStr)
      );
    });
  }
}

export async function getKnowledgeBases() {
  const rows = db.prepare('SELECT * FROM knowledge_bases ORDER BY created_at DESC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: decrypt(r.name),
    description: decrypt(r.description),
    createdAt: r.created_at
  }));
}

export async function createKnowledgeBase(id: string, name: string, description: string) {
  db.prepare('INSERT INTO knowledge_bases (id, name, description, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    encrypt(name),
    encrypt(description || ''),
    Date.now()
  );
}

export async function deleteKnowledgeBase(id: string) {
  const docs = db.prepare('SELECT id FROM knowledge_documents WHERE knowledge_base_id = ?').all(id) as any[];
  for (const doc of docs) {
    db.prepare('DELETE FROM knowledge_chunks WHERE document_id = ?').run(doc.id);
  }
  db.prepare('DELETE FROM knowledge_documents WHERE knowledge_base_id = ?').run(id);
  db.prepare('DELETE FROM knowledge_bases WHERE id = ?').run(id);
}

export async function getKnowledgeDocuments(knowledgeBaseId?: string) {
  let rows: any[];
  if (knowledgeBaseId) {
    rows = db.prepare('SELECT * FROM knowledge_documents WHERE knowledge_base_id = ? ORDER BY created_at DESC').all(knowledgeBaseId) as any[];
  } else {
    rows = db.prepare('SELECT * FROM knowledge_documents ORDER BY created_at DESC').all() as any[];
  }

  return rows.map(r => {
    const chunkCount = (db.prepare('SELECT COUNT(*) as c FROM knowledge_chunks WHERE document_id = ?').get(r.id) as any)?.c || 0;
    return {
      id: r.id,
      knowledgeBaseId: r.knowledge_base_id,
      title: decrypt(r.title),
      author: decrypt(r.author),
      category: decrypt(r.category),
      content: decrypt(r.content),
      version: r.version ? decrypt(r.version) : '1.0',
      sourceType: r.source_type ? decrypt(r.source_type) : 'manual',
      chunkCount,
      createdAt: r.created_at
    };
  });
}

export async function addKnowledgeDocument(id: string, knowledgeBaseId: string, title: string, author: string, category: string, content: string, version: string = '1.0', sourceType: string = 'manual') {
  const now = Date.now();
  db.prepare('INSERT INTO knowledge_documents (id, knowledge_base_id, title, author, category, content, version, source_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id,
    knowledgeBaseId,
    encrypt(title),
    encrypt(author || 'Anonim'),
    encrypt(category || 'Umum'),
    encrypt(content),
    encrypt(version),
    encrypt(sourceType),
    now
  );

  const chunks = chunkText(content);
  chunks.forEach((chunkStr, idx) => {
    const chunkId = `${id}-c${idx}`;
    db.prepare('INSERT INTO knowledge_chunks (id, document_id, chunk_index, content) VALUES (?, ?, ?, ?)').run(
      chunkId,
      id,
      idx,
      encrypt(chunkStr)
    );
  });
}

export async function deleteKnowledgeDocument(id: string) {
  db.prepare('DELETE FROM knowledge_chunks WHERE document_id = ?').run(id);
  db.prepare('DELETE FROM knowledge_documents WHERE id = ?').run(id);
}

export async function searchKnowledgeChunks(query: string, knowledgeBaseId?: string, topK = 5) {
  if (!query || !query.trim()) return [];

  const rawQuery = query.toLowerCase().trim();
  const queryWords = rawQuery.split(/\s+/).filter(w => w.length > 2);

  let docRows: any[];
  if (knowledgeBaseId) {
    docRows = db.prepare('SELECT * FROM knowledge_documents WHERE knowledge_base_id = ?').all(knowledgeBaseId) as any[];
  } else {
    docRows = db.prepare('SELECT * FROM knowledge_documents').all() as any[];
  }

  const docMap = new Map<string, { title: string; author: string; category: string }>();
  for (const doc of docRows) {
    docMap.set(doc.id, {
      title: decrypt(doc.title),
      author: decrypt(doc.author),
      category: decrypt(doc.category)
    });
  }

  if (docMap.size === 0) return [];

  const docIds = Array.from(docMap.keys());
  const placeholders = docIds.map(() => '?').join(',');
  const chunkRows = db.prepare(`SELECT * FROM knowledge_chunks WHERE document_id IN (${placeholders})`).all(...docIds) as any[];

  const scoredResults: any[] = [];

  for (const chunk of chunkRows) {
    const decryptedContent = decrypt(chunk.content);
    const contentLower = decryptedContent.toLowerCase();
    const docMeta = docMap.get(chunk.document_id);

    let score = 0;

    // Exact phrase matching bonus
    if (contentLower.includes(rawQuery)) {
      score += 50;
    }

    // Word occurrences matching
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 10;
        // Count frequency
        const count = contentLower.split(word).length - 1;
        score += Math.min(count * 2, 10);
      }
      // Metadata word match bonus (title / category / author)
      if (docMeta) {
        if (docMeta.title.toLowerCase().includes(word)) score += 15;
        if (docMeta.category.toLowerCase().includes(word)) score += 10;
      }
    }

    if (score > 0) {
      scoredResults.push({
        chunkId: chunk.id,
        documentId: chunk.document_id,
        documentTitle: docMeta?.title || 'Dokumen',
        documentAuthor: docMeta?.author || 'Anonim',
        documentCategory: docMeta?.category || 'Umum',
        chunkIndex: chunk.chunk_index,
        content: decryptedContent,
        score
      });
    }
  }

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.slice(0, topK);
}


