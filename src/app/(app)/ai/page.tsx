"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Bot, Plus, Trash2, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string | null;
}

interface Chat {
  id: string;
  title: string;
  model: string;
  updatedAt: string;
}

const FREE_MODELS = [
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super 120B" },
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B" },
  { id: "microsoft/phi-4-reasoning:free", name: "Phi-4 Reasoning" },
  { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1" },
  { id: "qwen/qwen3-235b-a22b:free", name: "Qwen3 235B" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B" },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash" },
];

function groupByDate(chats: Chat[]) {
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const week = new Date(today); week.setDate(today.getDate()-7);
  const groups: Record<string, Chat[]> = { "Сегодня": [], "Вчера": [], "На неделе": [], "Раньше": [] };
  for (const c of chats) {
    const d = new Date(c.updatedAt); d.setHours(0,0,0,0);
    if (d >= today) groups["Сегодня"].push(c);
    else if (d >= yesterday) groups["Вчера"].push(c);
    else if (d >= week) groups["На неделе"].push(c);
    else groups["Раньше"].push(c);
  }
  return groups;
}

export default function AIPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(FREE_MODELS[0].id);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadChats = useCallback(async () => {
    const res = await fetch("/api/ai/chats");
    if (res.ok) setChats(await res.json());
  }, []);

  const loadChat = useCallback(async (id: string) => {
    const res = await fetch(`/api/ai/chats/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
    setModel(data.model);
    setActiveChatId(id);
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const newChat = async () => {
    const res = await fetch("/api/ai/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    if (!res.ok) return;
    const chat = await res.json();
    setChats(prev => [chat, ...prev]);
    setActiveChatId(chat.id);
    setMessages([]);
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/ai/chats/${id}`, { method: "DELETE" });
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) { setActiveChatId(null); setMessages([]); }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    let chatId = activeChatId;
    if (!chatId) {
      const res = await fetch("/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      if (!res.ok) return;
      const chat = await res.json();
      chatId = chat.id;
      setActiveChatId(chat.id);
      setChats(prev => [chat, ...prev]);
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message: text, model }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Ошибка: ${data.error}` }]);
      return;
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content: data.content,
      reasoning: data.reasoning || null,
    }]);

    // Update chat title & order
    loadChats();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const groups = groupByDate(chats);

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-1.5rem)] -mx-4 -mt-4 md:-mx-6 md:-mt-6">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="hidden md:flex w-56 flex-col border-r border-border bg-surface shrink-0">
          <div className="p-2 border-b border-border">
            <button
              onClick={newChat}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Новый чат
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-1">
            {chats.length === 0 && (
              <p className="px-3 py-4 text-center text-[11px] text-text-muted">Нет чатов</p>
            )}
            {Object.entries(groups).map(([label, items]) =>
              items.length === 0 ? null : (
                <div key={label} className="mb-3">
                  <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">{label}</p>
                  {items.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => loadChat(chat.id)}
                      className={`group flex items-center justify-between rounded-md px-3 py-1.5 cursor-pointer transition-colors ${
                        activeChatId === chat.id
                          ? "bg-surface-hover text-text-primary"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                    >
                      <span className="truncate text-xs">{chat.title}</span>
                      <button
                        onClick={(e) => deleteChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 shrink-0 ml-1 text-text-muted hover:text-error transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 bg-surface">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={newChat}
            className="md:hidden flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {/* Model selector */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="ml-auto rounded border border-border bg-background px-2 py-1 text-xs text-text-primary outline-none focus:border-border-focus"
          >
            {FREE_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <Bot className="mx-auto h-8 w-8 text-text-muted/40" />
                <p className="text-sm text-text-muted">Начни новый разговор</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-hover border border-border">
                  <Bot className="h-3.5 w-3.5 text-text-muted" />
                </div>
              )}
              <div className={`max-w-[80%] space-y-1.5 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
                {msg.role === "assistant" && msg.reasoning && (
                  <div className="rounded border border-border bg-surface overflow-hidden">
                    <button
                      onClick={() => setExpandedReasoning(p => ({ ...p, [msg.id]: !p[msg.id] }))}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] text-text-muted hover:text-text-primary transition-colors"
                    >
                      <span>Reasoning</span>
                      {expandedReasoning[msg.id]
                        ? <ChevronDown className="h-3 w-3" />
                        : <ChevronRight className="h-3 w-3" />
                      }
                    </button>
                    {expandedReasoning[msg.id] && (
                      <div className="border-t border-border px-3 py-2 text-xs text-text-muted whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {msg.reasoning}
                      </div>
                    )}
                  </div>
                )}
                {msg.content && (
                  <div className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-surface border border-border text-text-primary"
                  }`}>
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-hover border border-border">
                <Bot className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Думает...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Напиши сообщение... (Enter — отправить)"
              className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus"
              style={{ minHeight: "42px", maxHeight: "160px" }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
