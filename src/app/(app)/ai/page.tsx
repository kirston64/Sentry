"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok || !data.content) {
      setMessages(prev => [...prev, { role: "assistant", content: `Ошибка: ${data.error || "нет ответа"}` }]);
      return;
    }

    setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] md:h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">AI Ассистент</h1>
          <span className="text-xs text-text-muted">Nemotron 120B</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-error transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Очистить
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Sparkles className="h-10 w-10 text-primary/40" />
            <p className="text-sm text-text-muted">Спроси что угодно про разработку сервера</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {[
                "С чего начать разработку RP сервера?",
                "Как сделать систему инвентаря?",
                "Объясни архитектуру EventManager",
                "Как защититься от читеров?",
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => { setInput(hint); textareaRef.current?.focus(); }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:border-primary/40 transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              msg.role === "user" ? "bg-primary/20" : "bg-surface-hover"
            }`}>
              {msg.role === "user"
                ? <User className="h-3.5 w-3.5 text-primary" />
                : <Bot className="h-3.5 w-3.5 text-text-muted" />
              }
            </div>
            <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary/10 text-text-primary"
                : "bg-surface border border-border text-text-primary"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-hover">
              <Bot className="h-3.5 w-3.5 text-text-muted" />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Думает...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Напиши сообщение... (Enter — отправить, Shift+Enter — перенос)"
          className="flex-1 resize-none rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus overflow-hidden"
          style={{ minHeight: "42px", maxHeight: "160px" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
