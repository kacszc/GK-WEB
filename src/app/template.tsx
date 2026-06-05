"use client";

// A template re-mounts on every navigation, so this entrance animation
// replays on each route change — a lightweight page transition.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col animate-page-in">{children}</div>;
}
