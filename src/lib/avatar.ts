// UI helpers for avatar placeholders (not backend data).

export const avatarColors = ["#f4c4a0", "#b9b3d6", "#a9c8e8", "#cfe3b8", "#e8b8c8"];

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
