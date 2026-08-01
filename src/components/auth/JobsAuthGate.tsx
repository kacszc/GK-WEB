"use client";

import { Dialog } from "@/components/ui/Dialog";
import { AuthGateFlow } from "@/components/auth/AuthGateFlow";
import type { QuickInterviewResult } from "@/components/auth/QuickInterviewForm";

/**
 * The signed-out "Szukam pracy" gate, shown OVER the job results (never on an empty screen):
 * register (in-modal quick form → mini interview) / login link / subtle skip. Skipping just
 * closes — the proposals are already visible behind it.
 */
export function JobsAuthGate({
  open,
  onClose,
  onFinished,
}: {
  open: boolean;
  onClose: () => void;
  /** Quick interview saved — apply what was picked (profession/industry) to the results. */
  onFinished: (picked: QuickInterviewResult) => void;
}) {
  return (
    // Non-dismissible + blurred backdrop: corridor tests showed people reflexively clicking the
    // offers behind the modal — one visible action only; leaving goes through the explicit "skip".
    <Dialog open={open} onClose={onClose} dismissible={false} backdrop="blur">
      <AuthGateFlow onSkip={onClose} onFinished={onFinished} loginRedirect="/jobs" />
    </Dialog>
  );
}
