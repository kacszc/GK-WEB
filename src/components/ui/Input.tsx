import { cn } from "@/lib/cn";

/** Canonical input styling — single source of truth for form controls. */
export const inputClass = (error?: boolean) =>
  cn(
    "w-full rounded-tile border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4",
    error ? "border-[#e0a400]" : "border-line-2 focus:border-ink",
  );

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean };

export function Input({ error, className, ...props }: InputProps) {
  return <input className={cn(inputClass(error), className)} {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export function Textarea({ error, className, ...props }: TextareaProps) {
  return <textarea className={cn(inputClass(error), "resize-y", className)} {...props} />;
}
