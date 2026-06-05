"use client";

import { useMutation } from "@tanstack/react-query";
import { jobsService } from "@/services";
import type { JobDraft } from "@/lib/types";

/** Publish a job posting (mutation). */
export function useCreateJob() {
  return useMutation({
    mutationFn: (draft: JobDraft) => jobsService.create(draft),
  });
}
