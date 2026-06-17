"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, MessageSquare, Send, Loader2 } from "lucide-react";
import { messagesService } from "@/services";
import { Avatar } from "@/components/ui/Avatar";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/config";
import { useThreadSocket } from "@/lib/useThreadSocket";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/types";

const intlTags: Record<Locale, string> = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };

/** Calendar-day key (local) for grouping messages under date dividers. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Combined inbox + thread view. The open conversation lives in component state, not the URL,
 * so the thread UUID never shows in the address bar. Deep links (/account/messages/<uuid>,
 * e.g. right after starting a chat) preselect that thread and then strip the id from the URL.
 * Desktop: list + thread side by side. Mobile: list, or thread with a back button.
 * Messages load the latest page first; scrolling to the top fetches older history on demand.
 */
export function MessagesScreen({ initialThreadId = null }: { initialThreadId?: string | null }) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(initialThreadId);
  const [draft, setDraft] = useState("");
  // Locally-appended messages (optimistic sends + live frames) kept per thread.
  const [extraByThread, setExtraByThread] = useState<Record<string, ChatMessage[]>>({});
  // Older history loaded by scrolling up, kept per thread (ascending, all before the first page).
  const [olderByThread, setOlderByThread] = useState<Record<string, ChatMessage[]>>({});
  const [fullyLoaded, setFullyLoaded] = useState<Record<string, boolean>>({});
  const [loadingOlder, setLoadingOlder] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // When a scroll-up load prepends older messages, remember the pre-prepend height to restore position.
  const prependPrevHeight = useRef<number | null>(null);

  // Deep link preselected a thread → clean the UUID out of the address bar (content unchanged).
  useEffect(() => {
    if (initialThreadId && typeof window !== "undefined") {
      window.history.replaceState(null, "", "/account/messages");
    }
  }, [initialThreadId]);

  const { data: convos = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: messagesService.getThreads,
  });
  const { data: thread } = useQuery({
    queryKey: ["thread", selectedId],
    queryFn: () => messagesService.getThread(selectedId as string),
    enabled: !!selectedId,
  });

  // Opening a thread marks it read server-side — refresh the inbox + header unread badge so the
  // count clears immediately (prefix-invalidates both ["conversations"] and the unread-count query).
  useEffect(() => {
    if (thread) queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [thread, selectedId, queryClient]);

  // Append a message, de-duping by id so optimistic + live frames don't double.
  const append = useCallback(
    (msg: ChatMessage) => {
      setExtraByThread((prev) => {
        if (!selectedId) return prev;
        const cur = prev[selectedId] ?? [];
        if (cur.some((x) => x.id === msg.id)) return prev;
        return { ...prev, [selectedId]: [...cur, msg] };
      });
    },
    [selectedId],
  );

  // Live updates over STOMP (no-op when no thread selected / signed out / backend down).
  useThreadSocket(selectedId, append);

  const olderMsgs = selectedId ? olderByThread[selectedId] ?? [] : [];
  const base = thread?.messages ?? [];
  const extra = selectedId ? extraByThread[selectedId] ?? [] : [];
  // older history (oldest) → first page → optimistic/live (newest); de-duped by id.
  const seen = new Set<string>();
  const messages = [...olderMsgs, ...base, ...extra].filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  const canLoadMore = !!thread?.hasMore && !!selectedId && !fullyLoaded[selectedId];

  // Auto-scroll to the bottom on open and when a message is appended at the bottom (send/live) —
  // but NOT when older history is prepended (handled separately to preserve the scroll position).
  const bottomCount = base.length + extra.length;
  useEffect(() => {
    const el = listRef.current;
    if (el && prependPrevHeight.current == null) el.scrollTop = el.scrollHeight;
  }, [selectedId, bottomCount]);

  // After older messages prepend, keep the viewport anchored on the same message (no jump).
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && prependPrevHeight.current != null) {
      el.scrollTop = el.scrollHeight - prependPrevHeight.current;
      prependPrevHeight.current = null;
    }
  }, [olderMsgs.length]);

  const loadOlder = useCallback(async () => {
    if (!selectedId || loadingOlder || !canLoadMore || messages.length === 0) return;
    const cursor = messages[0].createdAt;
    const el = listRef.current;
    prependPrevHeight.current = el ? el.scrollHeight : 0;
    setLoadingOlder(true);
    try {
      const page = await messagesService.getOlderMessages(selectedId, cursor);
      setOlderByThread((prev) => ({ ...prev, [selectedId]: [...page.messages, ...(prev[selectedId] ?? [])] }));
      if (!page.hasMore) setFullyLoaded((prev) => ({ ...prev, [selectedId]: true }));
    } catch {
      prependPrevHeight.current = null; // failed → don't try to restore a stale height
    } finally {
      setLoadingOlder(false);
    }
  }, [selectedId, loadingOlder, canLoadMore, messages]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    if (e.currentTarget.scrollTop <= 60) loadOlder();
  }

  function dayLabel(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (dayKey(iso) === dayKey(now.toISOString())) return t("account.chatToday");
    if (dayKey(iso) === dayKey(yesterday.toISOString())) return t("account.chatYesterday");
    return d.toLocaleDateString(intlTags[locale], { day: "numeric", month: "long", year: "numeric" });
  }

  async function send() {
    const text = draft.trim();
    if (!text || !selectedId) return;
    setDraft("");
    const msg = await messagesService.sendToThread(selectedId, text);
    append(msg);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("account.messagesTitle")}</h1>

      <div className="grid gap-4 lg:h-[calc(100vh-220px)] lg:grid-cols-[300px_1fr]">
        {/* Conversation list — full width on mobile until a thread is open, always shown on desktop. */}
        <div
          className={cn(
            "min-h-0 overflow-y-auto rounded-panel border border-line-3 bg-surface",
            selectedId ? "hidden lg:block" : "block",
          )}
        >
          {isLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-tile" />
              ))}
            </div>
          ) : convos.length === 0 ? (
            <div className="grid min-h-[200px] place-items-center px-4 text-center text-sm text-ink-3">
              {t("account.messagesEmpty")}
            </div>
          ) : (
            convos.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted",
                  i > 0 && "border-t border-line",
                  c.id === selectedId && "bg-muted",
                )}
              >
                <Avatar name={c.name} index={c.avatarIndex} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-ink">{c.name}</span>
                    <span className="shrink-0 text-[11px] text-ink-4">{c.time}</span>
                  </div>
                  <p className={cn("truncate text-[12px]", c.unread ? "font-medium text-ink" : "text-ink-3")}>
                    {c.lastMessage}
                  </p>
                  {c.jobTitle && (
                    <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-ink-4">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.jobTitle}</span>
                    </p>
                  )}
                </div>
                {c.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-violet px-1 text-[11px] font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Thread — hidden on mobile until one is selected; placeholder on desktop when none. */}
        <div
          className={cn(
            "min-h-0 flex-col rounded-panel border border-line-3 bg-surface",
            selectedId ? "flex h-[70vh] lg:h-auto" : "hidden lg:flex",
          )}
        >
          {!selectedId ? (
            <div className="grid flex-1 place-items-center px-6 text-center text-sm text-ink-3">
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-8 w-8 text-ink-4" />
                {t("account.chatSelect")}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-ink-2 hover:text-ink lg:hidden"
                  aria-label={t("account.chatBack")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {thread?.conversation && (
                  <>
                    <Avatar name={thread.conversation.name} index={thread.conversation.avatarIndex} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{thread.conversation.name}</p>
                      <p className="truncate text-[12px] text-ink-3">{thread.conversation.role}</p>
                    </div>
                    {/* Optional job-context tile — links to the job this conversation is about. */}
                    {thread.conversation.jobTitle && (
                      <Link
                        href={thread.conversation.jobId ? `/account/jobs/${thread.conversation.jobId}` : "#"}
                        className="hidden max-w-[45%] items-center gap-1.5 rounded-tile border border-line-2 bg-subtle px-2.5 py-1.5 text-[12px] text-ink-2 transition-colors hover:bg-muted sm:inline-flex"
                        title={thread.conversation.jobTitle}
                      >
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-ink-4" />
                        <span className="truncate">{thread.conversation.jobTitle}</span>
                      </Link>
                    )}
                  </>
                )}
              </div>

              <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {/* Top-of-history affordance: spinner while loading, hint when fully loaded. */}
                {loadingOlder && (
                  <div className="flex justify-center py-1 text-ink-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                {!canLoadMore && !loadingOlder && messages.length > 0 && (
                  <p className="py-1 text-center text-[11px] text-ink-4">{t("account.chatStart")}</p>
                )}

                {messages.map((m, i) => {
                  const showDay = i === 0 || dayKey(m.createdAt) !== dayKey(messages[i - 1].createdAt);
                  return (
                    <Fragment key={m.id}>
                      {showDay && (
                        <div className="flex justify-center py-1">
                          <span className="rounded-full bg-pill px-3 py-0.5 text-[11px] font-medium text-ink-3">
                            {dayLabel(m.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
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
                    </Fragment>
                  );
                })}
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
                  type="button"
                  onClick={send}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-tile bg-ink text-on-dark hover:bg-ink/90"
                  aria-label={t("account.chatPlaceholder")}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
