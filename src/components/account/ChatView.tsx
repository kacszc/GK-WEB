"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { messagesService } from "@/services";
import { Avatar } from "@/components/ui/Avatar";
import { useI18n } from "@/i18n/I18nProvider";
import { useThreadSocket } from "@/lib/useThreadSocket";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/types";

export function ChatView({ id }: { id: string }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  // Locally-appended messages (optimistic sends + live frames) kept per thread,
  // so switching threads needs no reset effect.
  const [extraByThread, setExtraByThread] = useState<Record<string, ChatMessage[]>>({});
  const extra = extraByThread[id] ?? [];
  const listRef = useRef<HTMLDivElement>(null);

  const { data: convos = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: messagesService.getThreads,
  });
  const { data: thread } = useQuery({
    queryKey: ["thread", id],
    queryFn: () => messagesService.getThread(id),
  });

  // Append a message, de-duping by id so optimistic + live frames don't double.
  const append = useCallback(
    (msg: ChatMessage) => {
      setExtraByThread((prev) => {
        const cur = prev[id] ?? [];
        if (cur.some((x) => x.id === msg.id)) return prev;
        return { ...prev, [id]: [...cur, msg] };
      });
    },
    [id],
  );

  // Live updates over STOMP (no-op when signed out / backend down).
  useThreadSocket(id, append);

  const messages = [...(thread?.messages ?? []), ...extra];

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const msg = await messagesService.sendToThread(id, text);
    append(msg);
  }

  return (
    <div className="grid gap-4 lg:h-[calc(100vh-200px)] lg:grid-cols-[280px_1fr]">
      {/* Conversation list (desktop) */}
      <div className="hidden overflow-y-auto rounded-panel border border-line-3 bg-surface lg:block">
        {convos.map((c) => (
          <Link
            key={c.id}
            href={`/account/messages/${c.id}`}
            className={cn(
              "flex items-center gap-3 border-b border-line px-3 py-3 transition-colors hover:bg-muted",
              c.id === id && "bg-muted",
            )}
          >
            <Avatar name={c.name} index={c.avatarIndex} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{c.name}</p>
              <p className="truncate text-[12px] text-ink-3">{c.lastMessage}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Thread */}
      <div className="flex h-[70vh] flex-col rounded-panel border border-line-3 bg-surface lg:h-auto">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Link href="/account/messages" className="text-ink-2 hover:text-ink lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {thread?.conversation && (
            <>
              <Avatar name={thread.conversation.name} index={thread.conversation.avatarIndex} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{thread.conversation.name}</p>
                <p className="truncate text-[12px] text-ink-3">{thread.conversation.role}</p>
              </div>
            </>
          )}
        </div>

        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-panel px-3.5 py-2 text-[13px]",
                  m.fromMe ? "bg-ink text-on-dark" : "bg-pill text-ink",
                )}
              >
                <p>{m.text}</p>
                <p className={cn("mt-1 text-[10px]", m.fromMe ? "text-on-dark-3" : "text-ink-4")}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-line p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("account.chatPlaceholder")}
            className="flex-1 rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-ink placeholder:text-ink-4"
          />
          <button
            onClick={send}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-tile bg-ink text-on-dark hover:bg-ink/90"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
