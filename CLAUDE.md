@AGENTS.md

# Frontend — skill.com

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4. Część monorepo (patrz `../CLAUDE.md`). Design jest źródłem prawdy — odwzorowanie **1:1 z Figmą**.

## Postawa (czytaj zawsze)

Działasz jak **senior frontend developer**:

- **Widoki mobilne to obowiązek.** Każdy komponent i ekran responsywny — mobile, tablet, desktop. Design z Figmy jest desktopowy (1440px), ale zawsze dodajesz sensowne breakpointy (`sm/md/lg/xl`). Mobile nie jest „na później".
- **Reużywaj komponentów.** Najpierw sprawdź `src/components/ui/` i `src/components/`. Powtarzalne wzorce (pille, chipy, karty, przyciski) = jeden komponent z wariantami, nie kopiuj-wklej.
- **Rozszerzaj, nie duplikuj.** Nowy wariant = nowy prop istniejącego komponentu, nie bliźniak.
- **Spójność.** Jeden zestaw tokenów (z design systemu), jedna konwencja nazewnictwa i struktury. Nowy kod wygląda jak istniejący. Żadnych ad-hoc wartości obok tokenów.
- **Jakość.** Czysty TypeScript, semantyczny HTML, dostępność (focus/aria), brak martwego kodu. `npm run lint` i `npm run build` muszą przechodzić.

## Tokeny

- Wszystkie kolory/radiusy/cienie/font są w `src/app/globals.css` (`@theme`) jako utility Tailwind v4: `bg-page`, `text-ink`, `text-ink-2`, `border-line`, `rounded-card`, `shadow-search` itd.
- Pełna specyfikacja i mapowanie: `../docs/DESIGN_SYSTEM.md`.
- Gradient marki: `bg-gradient-to-r from-brand-violet to-brand-blue`. Karta mapy: klasa `bg-map-card`.

## Struktura

```
src/
├── app/
│   ├── layout.tsx     # font Inter, <html lang="pl">
│   ├── page.tsx       # landing — komponuje sekcje
│   └── globals.css    # tokeny @theme
├── components/
│   ├── layout/        # Header, Footer
│   ├── landing/       # sekcje landingu
│   └── ui/            # prymitywy (Button, Pill, Chip, Badge, Card)
└── lib/               # utils, dane mockowe, typy
```

## Wzorce

- **Server Components domyślnie**; `"use client"` tylko dla interaktywności (search bar, toggle, autocomplete, mapa, Reveal).
- Ikony: `lucide-react`. Avatary: placeholdery (`@/lib/avatar`), nie używać wygasłych URL-i z Figmy.
- **Komentarze w kodzie po angielsku.**

## i18n (PL / EN / UK)

Dwie warstwy:
1. **Teksty UI** → frontend. Słowniki w `src/i18n/dictionaries/{pl,en,uk}.ts`. `pl.ts` to źródło prawdy (definiuje typ `Dictionary`); en/uk muszą mieć ten sam kształt.
2. **Dane dynamiczne** (nazwy zawodów, opisy) → backend. `api-client` wysyła nagłówek `Accept-Language`; backend zwraca dane w danym języku.

Użycie:
- **Server Component:** `const { t, dict, locale } = await getI18n();` (`@/i18n/server`). `t("klucz", { param })`, tablice/obiekty przez `dict.*`.
- **Client Component:** `const { t, dict, locale } = useI18n();` (`@/i18n/I18nProvider`).
- Locale wykrywane z cookie `NEXT_LOCALE` → potem `Accept-Language` (domyślnie `pl`). Przełącznik (`LanguageSwitcher`) ustawia cookie + `router.refresh()`.
- **Nie hardkodować napisów UI** — zawsze przez `t()`. Dodając tekst: dopisz klucz do **wszystkich trzech** słowników.
- Interpolacja: `{count}`, `{km}`, `{n}` itd.

## Dane — warstwa serwisów (`src/services/`)

Komponenty **nigdy nie sięgają po dane bezpośrednio** — wołają serwis z `@/services`:

- `searchService.suggest(query)` — autocomplete
- `catalogService.getPopularProfessions()`, `getTrending()`
- `statsService.getLiveStats()`
- treść statyczna (footer, legal, trust) z `content.ts`

Zasady:
- Serwisy są **async** (zwracają `Promise`), nawet dla mocków — dzięki temu podmiana na HTTP nie zmienia wywołań.
- Typy domenowe (kontrakt z backendem) w `@/lib/types`. Dane mockowe **tylko** w `src/services/mock-data.ts`.
- Mock symuluje sieć przez `mockDelay()` (losowe ms) → UI musi obsłużyć **stany ładowania** (skeletony).
- Każdy serwis ma `// TODO(backend):` z gotowym wywołaniem `apiGet(...)` (`@/lib/api-client`, `NEXT_PUBLIC_API_URL`). Podmiana = odkomentować HTTP, usunąć mock.
- Server Components `await`-ują serwis bezpośrednio; Client Components (np. search) wołają w efekcie z debounce + loading state.

## Animacje

- Utility w `globals.css`: `animate-fade-up`, `animate-fade-in`, `animate-pop-in`, klasa `reveal`/`is-visible`, `skeleton` (shimmer).
- `<Reveal>` (`@/components/ui/Reveal`) — fade+slide sekcji przy wejściu w viewport (IntersectionObserver). Owijaj nim sekcje na stronie.
- `<Skeleton>` / `<SuggestionSkeleton>` — placeholdery ładowania.
- Mikrointerakcje: hover-lift na kartach (`hover:-translate-y-1 hover:shadow-xl`), chipy (`hover:-translate-y-0.5`), zawsze z `transition`.
- Respektuj `prefers-reduced-motion` (obsłużone globalnie w `globals.css`).
