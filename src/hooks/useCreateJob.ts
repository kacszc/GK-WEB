"use client";

import { useMutation } from "@tanstack/react-query";
import { jobsService } from "@/services";
import type { JobDraft } from "@/lib/types";

/** Create a job posting — publish now or save as a draft. */
export function useCreateJob() {
  return useMutation({
    mutationFn: ({ draft, publish }: { draft: JobDraft; publish: boolean }) =>
      jobsService.create(draft, publish),
  });
}

/** Edit an existing owned job. */
export function useUpdateJob(id: string) {
  return useMutation({
    mutationFn: (draft: JobDraft) => jobsService.update(id, draft),
  });
}
