import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useBreadcrumb } from '../layout/breadcrumb';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import FileIcon from '../components/drive/FileIcon';
import { aiApi } from '../api/ai.api';
import { useAiRestriction } from '../lib/aiRestriction';
import { useAuth } from '../lib/auth';
import type { ChatMessage } from '../types';
import { formatFileSize, getFileExtension, getMonacoLanguage, isCodeFile, isImageFile, isPdfFile } from '../utils/driveUtils';

const BLOCKED_MESSAGE = 'Solve is disabled during this session.';
const THINKING_INSTRUCTION = 'Take your time to think step by step before answering.';

const CONVERSATIONS_KEY = 'ss_solve_conversations';
const THINKING_KEY = 'ss_solve_thinking';
const HISTORY_VISIBLE_KEY = 'ss_solve_history_visible';
const MAX_CONVERSATIONS = 50;

const ACCEPT_EXTENSIONS = '.py,.js,.ts,.java,.cpp,.c,.sql,.json,.txt,.pdf,.png,.jpg,.jpeg,.gif,.webp';

type QuickAction = { label: string; prefill: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Debug', prefill: 'Help me debug this code:\n\n' },
  { label: 'Explain', prefill: 'Explain what this code does:\n\n' },
  { label: 'Optimize', prefill: 'Optimize this code for performance:\n\n' },
  { label: 'Generate', prefill: 'Generate code that ' },
  { label: 'Convert', prefill: 'Convert this code to another language:\n\n' },
  { label: 'Algorithm', prefill: 'Explain how this algorithm works: ' },
  { label: 'Quiz', prefill: 'Generate a quiz question about ' },
  { label: 'Data Structures', prefill: 'Explain this data structure: ' },
];

interface AttachmentMeta {
  name: string;
  size: number;
  kind: 'image' | 'code' | 'pdf' | 'other';
  previewUrl?: string;
}

interface DisplayMessage extends ChatMessage {
  id: string;
  attachment?: AttachmentMeta;
}

interface Conversation {
  id: string;
  title: string;
  messages: DisplayMessage[];
  createdAt: string;
  updatedAt: string;
}

interface PendingAttachment {
  file: File;
  kind: 'image' | 'code' | 'pdf' | 'other';
  previewUrl?: string;
  content: string;
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(list: Conversation[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(list.slice(0, MAX_CONVERSATIONS)));
}

function loadThinking(): boolean {
  return localStorage.getItem(THINKING_KEY) === 'true';
}

function loadHistoryVisible(): boolean {
  const raw = localStorage.getItem(HISTORY_VISIBLE_KEY);
  return raw === null ? true : raw === 'true';
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function startOfDay(iso: string): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function groupLabel(iso: string): 'Today' | 'Yesterday' | 'Last 7 days' | 'Older' {
  const today = startOfDay(new Date().toISOString());
  const diffDays = Math.round((today - startOfDay(iso)) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last 7 days';
  return 'Older';
}

function groupConversations(list: Conversation[]): { label: string; items: Conversation[] }[] {
  const order = ['Today', 'Yesterday', 'Last 7 days', 'Older'] as const;
  const buckets: Record<string, Conversation[]> = { Today: [], Yesterday: [], 'Last 7 days': [], Older: [] };
  for (const conv of list) buckets[groupLabel(conv.updatedAt)].push(conv);
  return order.filter((label) => buckets[label].length > 0).map((label) => ({ label, items: buckets[label] }));
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function decodePdfEscapes(s: string): string {
  return s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, esc: string) => {
    switch (esc) {
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case 'b': return '\b';
      case 'f': return '\f';
      case '(': return '(';
      case ')': return ')';
      case '\\': return '\\';
      default: return String.fromCharCode(parseInt(esc, 8));
    }
  });
}

/**
 * Best-effort PDF text extraction with no external dependency: scans the raw
 * bytes for `(...)Tj` / `[(...)...]TJ` show-text operators. Works for simple,
 * uncompressed PDFs; PDFs with compressed (FlateDecode) content streams won't
 * yield text this way, so the result may be empty for those files.
 */
function extractPdfText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let raw = '';
  for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);

  const pieces: string[] = [];
  const tjSingle = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tjSingle.exec(raw)) !== null) pieces.push(decodePdfEscapes(m[1]));

  const tjArray = /\[((?:\\.|[^[\]])*)\]\s*TJ/g;
  while ((m = tjArray.exec(raw)) !== null) {
    const inner = /\(((?:\\.|[^()\\])*)\)/g;
    let im: RegExpExecArray | null;
    while ((im = inner.exec(m[1])) !== null) pieces.push(decodePdfEscapes(im[1]));
  }

  return pieces.join(' ').replace(/\s+/g, ' ').trim();
}

function detectAttachmentKind(ext: string): 'image' | 'code' | 'pdf' | 'other' {
  if (isPdfFile(ext)) return 'pdf';
  if (isImageFile(ext)) return 'image';
  if (isCodeFile(ext)) return 'code';
  return 'other';
}

async function buildPendingAttachment(file: File): Promise<PendingAttachment> {
  const ext = getFileExtension(file.name);
  const kind = detectAttachmentKind(ext);
  if (kind === 'image') {
    const dataUrl = await readFileAsDataURL(file);
    return { file, kind, previewUrl: dataUrl, content: dataUrl };
  }
  if (kind === 'pdf') {
    const buffer = await readFileAsArrayBuffer(file);
    return { file, kind, content: extractPdfText(buffer).slice(0, 2000) };
  }
  const text = await readFileAsText(file);
  return { file, kind, content: text };
}

function buildOutgoingMessage(text: string, attachment: PendingAttachment | null): string {
  let message = text;
  if (attachment) {
    const ext = getFileExtension(attachment.file.name);
    if (attachment.kind === 'image') {
      message += `\n\nImage jointe: ${attachment.file.name}\n${attachment.content}`;
    } else if (attachment.kind === 'pdf') {
      message += `\n\nFichier PDF joint: ${attachment.file.name}\n\n${attachment.content}`;
    } else {
      const lang = getMonacoLanguage(ext);
      message += `\n\nFichier joint: ${attachment.file.name}\n\`\`\`${lang}\n${attachment.content}\n\`\`\``;
    }
  }
  if (loadThinking()) {
    message += `\n\n${THINKING_INSTRUCTION}`;
  }
  return message;
}

type ContentSegment = { type: 'text'; value: string } | { type: 'code'; lang: string; code: string };

function parseSegments(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const re = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) segments.push({ type: 'text', value: content.slice(last, m.index) });
    segments.push({ type: 'code', lang: m[1] || 'text', code: m[2].replace(/\n$/, '') });
    last = re.lastIndex;
  }
  if (last < content.length) segments.push({ type: 'text', value: content.slice(last) });
  return segments;
}

function renderContent(content: string) {
  return parseSegments(content).map((seg, i) => {
    if (seg.type === 'code') {
      return (
        <div key={i} className="chat-code-block">
          <div className="chat-code-header">
            <span className="chat-code-lang">{seg.lang}</span>
            <button className="chat-code-copy" onClick={() => navigator.clipboard?.writeText(seg.code)}>
              <Icon name="copy" size={11} /> Copy
            </button>
          </div>
          <div className="chat-code-body">{seg.code}</div>
        </div>
      );
    }
    return seg.value ? <span key={i}>{seg.value}</span> : null;
  });
}

export default function AiAssistant() {
  useBreadcrumb(['Solve']);
  const pushToast = useToast();
  const { aiRestricted, returnPath } = useAiRestriction();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(() => loadThinking());
  const [historyVisible, setHistoryVisible] = useState(() => loadHistoryVisible());
  const [selectedPill, setSelectedPill] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const maxHeight = 4 * 22 + 20;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [input]);

  function persistConversations(next: Conversation[]) {
    setConversations(next);
    saveConversations(next);
  }

  function upsertConversation(id: string, finalMessages: DisplayMessage[]): void {
    const now = new Date().toISOString();
    const existing = conversations.find((c) => c.id === id);
    if (existing) {
      const updated = conversations.map((c) => (c.id === id ? { ...c, messages: finalMessages, updatedAt: now } : c));
      updated.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      persistConversations(updated);
    } else {
      const firstUser = finalMessages.find((m) => m.role === 'user');
      const title = (firstUser?.content ?? '').slice(0, 35) || 'Conversation';
      const conv: Conversation = { id, title, messages: finalMessages, createdAt: now, updatedAt: now };
      persistConversations([conv, ...conversations]);
    }
  }

  function newChat() {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setSelectedPill(null);
    setAttachment(null);
  }

  function loadConversation(conv: Conversation) {
    setActiveConversationId(conv.id);
    setMessages(conv.messages);
    setInput('');
    setSelectedPill(null);
    setAttachment(null);
  }

  function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    persistConversations(conversations.filter((c) => c.id !== id));
    if (activeConversationId === id) newChat();
  }

  function clearAllHistory() {
    persistConversations([]);
    newChat();
  }

  function scrollPills(dir: 1 | -1) {
    pillsRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  }

  function pickQuickAction(qa: QuickAction) {
    setSelectedPill(qa.label);
    setInput(qa.prefill);
    textareaRef.current?.focus();
  }

  function toggleThinking() {
    setThinking((prev) => {
      const next = !prev;
      localStorage.setItem(THINKING_KEY, String(next));
      return next;
    });
  }

  function toggleHistoryVisible() {
    setHistoryVisible((prev) => {
      const next = !prev;
      localStorage.setItem(HISTORY_VISIBLE_KEY, String(next));
      return next;
    });
  }

  async function attachFile(file: File) {
    setAttaching(true);
    try {
      const pending = await buildPendingAttachment(file);
      setAttachment(pending);
    } catch {
      pushToast('error', 'Could not read that file');
    } finally {
      setAttaching(false);
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) attachFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) attachFile(file);
  }

  function removeAttachment() {
    setAttachment(null);
  }

  function copyMessage(content: string) {
    navigator.clipboard?.writeText(content);
    pushToast('success', 'Copied to clipboard');
  }

  function rateMessage(id: string, kind: 'up' | 'down') {
    setFeedback((prev) => {
      const next = { ...prev };
      if (next[id] === kind) delete next[id];
      else next[id] = kind;
      return next;
    });
  }

  async function send() {
    const text = input.trim();
    if ((!text && !attachment) || loading) return;

    const attachmentMeta: AttachmentMeta | undefined = attachment
      ? { name: attachment.file.name, size: attachment.file.size, kind: attachment.kind, previewUrl: attachment.previewUrl }
      : undefined;

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text || attachment!.file.name,
      attachment: attachmentMeta,
    };
    const priorMessages = messages;
    const nextMessages = [...priorMessages, userMessage];
    const outgoingText = buildOutgoingMessage(text, attachment);

    setMessages(nextMessages);
    setInput('');
    setAttachment(null);
    setSelectedPill(null);
    setLoading(true);

    try {
      const conversationHistory: ChatMessage[] = priorMessages.map(({ role, content }) => ({ role, content }));
      const res = await aiApi.chat({ message: outgoingText, conversationHistory });
      if (res.blocked) {
        const blockedMessages = [...nextMessages, { id: crypto.randomUUID(), role: 'assistant' as const, content: BLOCKED_MESSAGE }];
        setMessages(blockedMessages);
      } else {
        const finalMessages: DisplayMessage[] = [...nextMessages, { id: crypto.randomUUID(), role: 'assistant', content: res.reply }];
        setMessages(finalMessages);
        const convId = activeConversationId ?? crypto.randomUUID();
        if (!activeConversationId) setActiveConversationId(convId);
        upsertConversation(convId, finalMessages);
      }
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not reach Solve');
      setMessages(nextMessages);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  }

  if (aiRestricted) {
    return <Navigate to={returnPath ?? '/student'} replace />;
  }

  const groups = groupConversations(conversations);

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <div
          style={{
            flexShrink: 0,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button className="chat-toolbar-btn" title="New chat" onClick={newChat}>
            <Icon name="edit" size={17} />
          </button>
          <button
            className="chat-toolbar-btn"
            title={historyVisible ? 'Hide history' : 'Show history'}
            onClick={toggleHistoryVisible}
          >
            <Icon name="panel" size={17} />
          </button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '26px 34px' }}>
          {messages.length === 0 ? (
            <div style={{ maxWidth: 720, margin: '40px auto 0', textAlign: 'center' }}>
              <div className="empty-state-icon" style={{ width: 60, height: 60 }}>
                <Icon name="sparkles" size={26} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', margin: '0 0 6px' }}>
                What do you want to solve?
              </h1>
              <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', margin: '0 0 24px' }}>
                Specialized in programming and computer science
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="chat-pill-nav" onClick={() => scrollPills(-1)}>
                  <Icon name="chevron-left" size={16} />
                </button>
                <div ref={pillsRef} className="chat-pill-row">
                  {QUICK_ACTIONS.map((qa) => (
                    <button
                      key={qa.label}
                      className={`chat-pill ${selectedPill === qa.label ? 'chat-pill-active' : ''}`}
                      onClick={() => pickQuickAction(qa)}
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
                <button className="chat-pill-nav" onClick={() => scrollPills(1)}>
                  <Icon name="chevron-right" size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820, margin: '0 auto' }}>
              {messages.map((m) => {
                if (m.role === 'user') {
                  return (
                    <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', alignSelf: 'flex-end', flexDirection: 'row-reverse' }}>
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>{user?.initials ?? 'U'}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {m.attachment && (
                          <div className="chat-attach-pill">
                            <FileIcon fileType={getFileExtension(m.attachment.name)} size="sm" />
                            {m.attachment.name} · {formatFileSize(m.attachment.size)}
                          </div>
                        )}
                        <div className="chat-bubble-user">{m.content}</div>
                      </div>
                    </div>
                  );
                }
                if (m.content === BLOCKED_MESSAGE) {
                  return (
                    <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Icon name="x-circle" size={16} color="var(--error-strong)" />
                      <div className="chat-bubble-blocked">{m.content}</div>
                    </div>
                  );
                }
                const fb = feedback[m.id];
                return (
                  <div key={m.id} className="chat-msg-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>
                      <Icon name="sparkles" size={14} color="#fff" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                      <div className="chat-bubble-assistant">{renderContent(m.content)}</div>
                      <div className="chat-msg-actions">
                        <button className="chat-msg-action-btn" title="Copy" onClick={() => copyMessage(m.content)}>
                          <Icon name="copy" size={13} />
                        </button>
                        <button
                          className={`chat-msg-action-btn ${fb === 'up' ? 'chat-msg-action-btn-active-up' : ''}`}
                          title="Good response"
                          onClick={() => rateMessage(m.id, 'up')}
                        >
                          <Icon name="thumbs-up" size={13} />
                        </button>
                        <button
                          className={`chat-msg-action-btn ${fb === 'down' ? 'chat-msg-action-btn-active-down' : ''}`}
                          title="Bad response"
                          onClick={() => rateMessage(m.id, 'down')}
                        >
                          <Icon name="thumbs-down" size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>
                    <Icon name="sparkles" size={14} color="#fff" />
                  </div>
                  <div className="chat-bubble-assistant chat-typing" style={{ padding: '4px 16px' }}>
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 34px', flexShrink: 0 }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            {attachment ? (
              <div className="chat-attach-preview">
                {attachment.kind === 'image' && attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt={attachment.file.name} style={{ maxHeight: 56, borderRadius: 8 }} />
                ) : (
                  <FileIcon fileType={getFileExtension(attachment.file.name)} size="md" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attachment.file.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{formatFileSize(attachment.file.size)}</div>
                </div>
                <button className="chat-attach-remove" onClick={removeAttachment}>
                  <Icon name="x" size={14} />
                </button>
              </div>
            ) : (
              <div
                className={`chat-dropzone ${dragOver ? 'chat-dropzone-active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <input ref={fileInputRef} type="file" accept={ACCEPT_EXTENSIONS} style={{ display: 'none' }} onChange={onFileInputChange} />
                <div className="chat-dropzone-icon">
                  <Icon name="image" size={18} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                  {attaching ? 'Reading file…' : 'Drag & drop or click to add a file'}
                </div>
              </div>
            )}

            <div style={{ border: '1px solid var(--border)', borderRadius: attachment ? 'var(--r-lg)' : '0 0 var(--r-lg) var(--r-lg)', background: 'var(--surface)', padding: '14px 16px' }}>
              <textarea
                ref={textareaRef}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', minHeight: 22, lineHeight: '22px' }}
                rows={1}
                placeholder="Type your question here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <button onClick={toggleThinking} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                  <span className={`toggle-pill ${thinking ? 'toggle-pill-on' : ''}`} style={{ width: 36, height: 20 }}>
                    <span className={`toggle-knob ${thinking ? 'toggle-knob-on' : ''}`} style={{ width: 16, height: 16, transform: thinking ? 'translateX(16px)' : 'translateX(0)' }} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--ink-muted)' }}>Thinking</span>
                </button>
                <button className="chat-send-btn" onClick={send} disabled={(!input.trim() && !attachment) || loading} title="Send">
                  <Icon name="arrow-up" size={18} color="#fff" />
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 6 }}>Ctrl+Enter to send</div>
          </div>
        </div>
      </div>

      {historyVisible && (
        <aside className="chat-sidebar">
          <div className="chat-sidebar-title">Recent conversations</div>
          <div className="chat-sidebar-list">
            {conversations.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '4px 8px' }}>No conversations yet</div>
            ) : (
              groups.map((group) => (
                <div key={group.label}>
                  <div className="chat-conv-group-label">{group.label}</div>
                  {group.items.map((conv) => (
                    <div
                      key={conv.id}
                      className={`chat-conv-item ${conv.id === activeConversationId ? 'chat-conv-item-active' : ''}`}
                      onClick={() => loadConversation(conv)}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="chat-conv-title">{conv.title}</div>
                        <div className="chat-conv-date">{relativeTime(conv.updatedAt)}</div>
                      </div>
                      <button className="chat-conv-delete" title="Delete conversation" onClick={(e) => deleteConversation(conv.id, e)}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
          {conversations.length > 0 && (
            <button className="chat-clear-all" onClick={clearAllHistory}>
              Clear all history
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
