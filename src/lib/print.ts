/**
 * Print a single element as PDF via the browser (File → Save as PDF).
 *
 * Uses the classic visibility-toggle technique: the target subtree stays visible while everything
 * else is hidden, so it works regardless of where the element sits in the DOM (e.g. a modal). The
 * temporary classes are removed after printing. See the `@media print` rules in globals.css.
 */
export function printArea(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.add("print-target");
  document.body.classList.add("print-only-target");
  const cleanup = () => {
    el.classList.remove("print-target");
    document.body.classList.remove("print-only-target");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
