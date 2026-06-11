"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { messagesService } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";

export type MessageTarget = { id: string; name: string };

/**
 * Compose the first message to a job-flow counterparty (applicant ↔ employer), then drop the
 * user into the live conversation. Messaging between connected parties is free — no token cost.
 */
export function MessageComposerDialog({
  target,
  onClose,
}: {
  target: MessageTarget | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { show } = useToast();
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Reset the draft when a different counterparty is targeted.
  const [lastId, setLastId] = useState<string | null>(null);
  if (target && target.id !== lastId) {
    setLastId(target.id);
    setText("");
  }

  async function send() {
    if (!target || !text.trim()) return;
    setSending(true);
    try {
      const { threadId } = await messagesService.send(target.id, text.trim());
      onClose();
      router.push(`/account/messages/${threadId}`);
    } catch (e) {
      show(requestErrorToast(e, t));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={!!target} onClose={onClose} title={t("messageCompose.title")}>
      {target && (
        <>
          <div className="flex items-center gap-3 rounded-tile bg-subtle p-3">
            <Avatar name={target.name} index={0} size={40} />
            <p className="truncate text-sm font-semibold text-ink">{target.name}</p>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            autoFocus
            placeholder={t("messageCompose.placeholder")}
            className="mt-4 w-full resize-y rounded-tile border border-line-2 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-tile px-4 py-2.5 text-sm">
              {t("messageCompose.cancel")}
            </Button>
            <Button
              variant="dark"
              onClick={send}
              disabled={sending || !text.trim()}
              className="rounded-tile px-4 py-2.5 text-sm disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("messageCompose.send")}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
