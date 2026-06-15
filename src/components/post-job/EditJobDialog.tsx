"use client";

import { Dialog } from "@/components/ui/Dialog";
import { PostJobScreen } from "./PostJobScreen";
import { useI18n } from "@/i18n/I18nProvider";

/** Edit an owned job in a large in-account modal (reuses the post-job form, no page chrome). */
export function EditJobDialog({
  jobId,
  open,
  onClose,
}: {
  jobId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onClose={onClose} size="xl" title={t("postJob.editTitle")}>
      {/* Remount per open so the form re-seeds from the latest job data. */}
      {open && <PostJobScreen key={jobId} jobId={jobId} asDialog onSaved={onClose} />}
    </Dialog>
  );
}
