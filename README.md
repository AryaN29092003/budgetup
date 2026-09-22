# Paisa — Personal Budget App

A minimalistic, mobile-first personal budgeting Progressive Web App. Local-first, no backend required — all data lives in your browser via IndexedDB.

---

## Quick start

```bash
npm install
npm run dev       # development server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
```

---

## Project structure

```
src/
├── components/
│   ├── ui/               # Reusable design-system primitives
│   ├── layout/           # App shell: sidebar, bottom nav, outlet wrapper
│   ├── dashboard/        # (Phase 2) Home screen widgets
│   ├── transactions/     # (Phase 2) Transaction list & forms
│   ├── budgets/          # (Phase 3) Budget cards
│   └── insights/         # (Phase 4) Charts & analytics
├── pages/                # One file per route, thin wrappers
├── db/                   # Dexie database class & singleton
├── services/             # All IndexedDB access — never import db/ directly from components
├── hooks/                # React hooks that call services
├── utils/                # currency.ts, date.ts
├── types/                # All shared TypeScript interfaces & enums
├── lib/                  # cn() utility
├── App.tsx               # Router + ThemeApplier
├── main.tsx
└── index.css             # Tailwind v4 + CSS custom property tokens
```

---

## Architecture

Data flows strictly top-to-bottom:

```
Pages → Components → Hooks → Services → Dexie → IndexedDB
```

Components never import from `src/db/` directly. All database access is mediated by services, which are called from hooks.

---

## Database

Built on [Dexie.js](https://dexie.org/). Database name: `BudgetApp`, version `1`.

| Table          | Primary key | Notable indexes              |
|----------------|-------------|------------------------------|
| `transactions` | `id`        | `type`, `categoryId`, `date` |
| `categories`   | `id`        | `type`, `isDefault`          |
| `budgets`      | `id`        | `month`, `categoryId`        |
| `settings`     | `id`        | —                            |

Schema migrations use Dexie's `.version(n).stores({})` API. When adding indexes in future phases, bump the version and add a new block — never mutate an existing version.

---

## Theme system

Three modes: **Light**, **Dark**, **System** (follows OS preference).

- Resolved theme is applied as a `dark` class on `<html>`.
- All colours are CSS custom properties on `:root` (light) and `.dark` (dark) in `index.css`.
- Components reference `var(--color-primary)` etc. — never hardcoded hex.
- Preference is persisted to IndexedDB via `settingsService`.

### Core tokens

| Token                      | Light              | Dark        |
|----------------------------|--------------------|-------------|
| `--color-background`       | `#F7F6F3` (ivory)  | `#0F0F0F`   |
| `--color-surface`          | `#FFFFFF`          | `#1A1A1A`   |
| `--color-primary`          | `#0D9488` (teal)   | `#A3E635` (lime) |
| `--color-text-primary`     | `#1C1C1E`          | `#F0EFE9`   |

---

## Currency

```ts
formatCurrency(2500)                 // ₹2,500  (INR default)
formatCurrency(2500, 'USD')          // $2,500
formatCurrencyCompact(125000, 'INR') // ₹1.3L
```

Never hardcode `₹`. Pull `currency` from `useSettings()`.

---

## Navigation

- **Mobile** — Fixed bottom bar: Home · Transactions · `+` · Insights · Settings
- **Desktop (lg+)** — Fixed left sidebar with same links

One `AppLayout` wraps both. No separate mobile/desktop code trees.

---

## Settings defaults

| Field               | Default  |
|---------------------|----------|
| `currency`          | `INR`    |
| `theme`             | `system` |
| `firstDayOfMonth`   | `1`      |
| `onboardingCompleted` | `false` |

---

## Planned phases

| Phase | Focus |
|---|---|
| **1 (current)** | Foundation: routing, layout, DB schema, theme, settings, UI primitives |
| **2** | Transaction management: add/edit/delete, list, categories |
| **3** | Monthly budgets: per-category limits, progress tracking |
| **4** | Insights: Recharts spending breakdowns and trends |
| **5** | PWA: vite-plugin-pwa, offline support, install prompt |
| **6** | Polish: onboarding, empty states, accessibility audit |

---

## Before Phase 2 — review items

1. **Compound index** — `budgetService.upsert` queries `[month+categoryId]` but the DB schema doesn't declare it. Add `'&[month+categoryId]'` to budgets store before Phase 3.
2. **Category seeding** — `categoryService.seedDefaults()` is implemented but not called. Wire into startup before Phase 2.
3. **Route code-splitting** — Current bundle is 453 kB JS (147 kB gzip). Consider `React.lazy()` per route before Phase 2.
4. **Error boundaries** — No React error boundary yet. Add one wrapping `<AppLayout>` before real data operations land.
5. **Toast component** — `@radix-ui/react-toast` is installed but unwired. Implement before Phase 2 so save/error feedback is available.
