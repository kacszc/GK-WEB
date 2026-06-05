import { useEffect, useState } from "react";

const CARET = "▏";
const GAP = " "; // hair space so width barely shifts when caret blinks off

/**
 * Typewriter effect for placeholders: types a word, pauses, deletes it,
 * then moves to the next — with a blinking caret. Returns "" when inactive.
 * Respects prefers-reduced-motion.
 */
export function useTypewriter(words: string[], active: boolean): string {
  const [typed, setTyped] = useState("");
  const [caretOn, setCaretOn] = useState(true);

  // Typing / deleting loop.
  useEffect(() => {
    if (!active || words.length === 0) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      const t = setTimeout(() => setTyped(words[0]), 0);
      return () => clearTimeout(t);
    }

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = () => {
      const word = words[wordIndex % words.length];
      if (!deleting) {
        charIndex += 1;
        setTyped(word.slice(0, charIndex));
        if (charIndex >= word.length) {
          deleting = true;
          timer = setTimeout(run, 1600); // pause on the full word
          return;
        }
        timer = setTimeout(run, 85);
      } else {
        charIndex -= 1;
        setTyped(word.slice(0, Math.max(0, charIndex)));
        if (charIndex <= 0) {
          deleting = false;
          wordIndex += 1;
          timer = setTimeout(run, 450); // pause before the next word
          return;
        }
        timer = setTimeout(run, 45);
      }
    };

    timer = setTimeout(run, 600);
    return () => clearTimeout(timer);
  }, [active, words]);

  // Blinking caret.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setCaretOn((v) => !v), 520);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return "";
  return `${typed}${caretOn ? CARET : GAP}`;
}
