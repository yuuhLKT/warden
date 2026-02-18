# Warden — Agent Guidelines

Warden is a **Tauri v2 desktop application** that manages local dev projects and their services.
The stack is: **React 19 + TypeScript + Tailwind CSS v4** (frontend) and **Rust** (Tauri backend).
State is managed with Zustand; validation with Zod; UI primitives from Radix UI / shadcn.

---

## Repository Layout

```
warden/
├── src/                   # React/TypeScript frontend
│   ├── app/               # Providers, app-level setup
│   ├── components/        # UI components (common/, dashboard/, layout/, project/, ui/)
│   ├── hooks/             # Custom React hooks (use-*.ts)
│   ├── i18n/              # Internationalisation (i18next)
│   ├── lib/               # Shared utilities: api.ts, toast.ts, utils.ts
│   ├── pages/             # Top-level page components
│   ├── schemas/           # Zod schemas (mirrors types/)
│   ├── stores/            # Zustand stores (*-store.ts)
│   └── types/             # TypeScript type definitions
└── src-tauri/             # Rust Tauri backend
    └── src/
        ├── commands/      # #[tauri::command] handlers
        ├── config_store/  # Persistent app configuration
        ├── database/      # SQLite init & migrations (rusqlite)
        ├── models/        # Rust data structs (serde Serialize/Deserialize)
        ├── repositories/  # Database repository pattern
        └── utils/         # Helpers (project_scanner, etc.)
```

---

## Commands

### Frontend (run from repo root, package manager: `bun`)

| Purpose                      | Command                |
| ---------------------------- | ---------------------- |
| Dev server (frontend only)   | `bun run dev`          |
| Full Tauri dev (recommended) | `bunx tauri dev`       |
| Type-check (lint)            | `bun run lint`         |
| Production build             | `bun run build`        |
| Format source files          | `bun run format`       |
| Check formatting             | `bun run format:check` |
| Tauri production build       | `bunx tauri build`     |

> There is **no test suite** configured at this time. When tests are added they
> should use Vitest (consistent with the Vite toolchain). A single test file can
> then be run with: `bunx vitest run src/path/to/file.test.ts`

### Rust backend (run from `src-tauri/`)

| Purpose               | Command                        |
| --------------------- | ------------------------------ |
| Check compilation     | `cargo check`                  |
| Run all tests         | `cargo test`                   |
| Run a single test     | `cargo test <test_name>`       |
| Run tests in a module | `cargo test commands::project` |
| Format Rust code      | `cargo fmt`                    |
| Lint (clippy)         | `cargo clippy -- -D warnings`  |

> Always run `cargo check` and `cargo clippy` before committing Rust changes.

---

## Code Style — TypeScript / React

### Formatting (enforced by Prettier)

- **No semicolons** (`"semi": false`)
- **Double quotes** (`"singleQuote": false`)
- **2-space indentation** (`"tabWidth": 2`)
- **Trailing commas** where valid in ES5 (`"trailingComma": "es5"`)
- **Print width**: 100 characters
- Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`

Run `bun run format` to auto-fix; CI checks with `bun run format:check`.

### TypeScript

- **Strict mode** is enabled — no `any`, no implicit `any`.
- `noUnusedLocals` and `noUnusedParameters` are errors; remove unused code.
- `noFallthroughCasesInSwitch` is enforced.
- Use the `@/` alias for all imports from `src/` (e.g. `import { foo } from "@/lib/utils"`).
- Prefer `type` imports for types: `import type { Foo } from "@/types/foo"`.
- Value imports (functions, classes, consts) use regular imports.
- Export named exports; avoid default exports except for page/component entry points.

### Naming Conventions

- **Files**: `kebab-case` for all files (`project-store.ts`, `use-project-form.ts`).
- **Components**: `PascalCase` function components exported as named exports.
- **Hooks**: `camelCase` prefixed with `use` (`useProjectForm`, `useWorkspace`).
- **Types / Interfaces**: `PascalCase`. Prefer `type` aliases over `interface` for unions/intersections; use `interface` for object shapes that may be extended.
- **Zod schemas**: `camelCase` suffixed with `Schema` (`projectFormSchema`).
- **Store files**: `*-store.ts`; exported hook follows `use<Name>Store` pattern.
- **Constants**: `SCREAMING_SNAKE_CASE` for module-level constants; `camelCase` for local.

### Imports Order (maintain manually; Prettier does not enforce order)

1. React / React ecosystem (`react`, `react-dom`, …)
2. Third-party libraries (`zustand`, `zod`, `lucide-react`, …)
3. Tauri APIs (`@tauri-apps/…`)
4. Internal aliases (`@/stores/…`, `@/types/…`, `@/lib/…`, `@/components/…`)
5. Relative imports (`./foo`, `../bar`)

### Components

- Use functional components exclusively; no class components.
- Co-locate component-specific logic in hooks under `src/hooks/`.
- shadcn/Radix UI primitives live in `src/components/ui/`; do not modify them directly — re-export or wrap instead.
- Apply Tailwind utility classes directly in JSX; avoid inline `style` props.
- Use `cn()` from `@/lib/utils` (merges `clsx` + `tailwind-merge`) for conditional class names.

### State Management

- All global state lives in Zustand stores under `src/stores/`.
- Stores expose **typed interfaces** (e.g. `ProjectState`) and are created with `create<T>()`.
- Async actions call Tauri commands via `src/lib/api.ts` helpers and handle errors with `try/catch`; errors are logged with `console.error` and re-thrown when the caller needs to react.
- Do **not** put derived/computed values into store state; use selector functions (e.g. `getSelectedProject`, `getRunningServicesCount`).

### Validation

- All form data is validated with **Zod** schemas defined in `src/schemas/`.
- Schema files mirror the shapes in `src/types/`; infer TypeScript types from schemas using `z.infer<typeof mySchema>`.
- Use `.safeParse()` for user-input validation; unwrap with `result.success` guards.

### Error Handling

- In stores/hooks: wrap Tauri `invoke` calls in `try/catch`; `console.error` the error, optionally surface it via `sonner` toasts (`src/lib/toast.ts`).
- Propagate errors upward when the UI must handle them (re-`throw` after logging).
- Never swallow errors silently without at minimum a `console.error`.

---

## Code Style — Rust

### Formatting & Linting

- All Rust code must pass `cargo fmt` (default style) and `cargo clippy -- -D warnings`.
- `#[allow(dead_code)]` is acceptable for functions not yet wired up; remove it once the code is used.

### Naming Conventions

- **Structs / Enums**: `PascalCase`.
- **Functions / variables**: `snake_case`.
- **Constants**: `SCREAMING_SNAKE_CASE`.
- Module files follow Rust conventions: `mod.rs` for module roots, otherwise `feature_name.rs`.

### Architecture

- **Commands** (`src-tauri/src/commands/`): thin handlers that parse inputs, acquire the DB lock, delegate to repositories, and return `Result<T, String>`. Map errors with `.map_err(|e| e.to_string())`.
- **Repositories** (`src-tauri/src/repositories/`): encapsulate all SQL; take `&Connection` and return `rusqlite::Result<T>`.
- **Models** (`src-tauri/src/models/`): plain structs deriving `Debug, Clone, Serialize, Deserialize`. Use `#[serde(rename_all = "camelCase")]` on types sent to the frontend.
- **AppState**: `Mutex<Database>` wrapped in `tauri::State`; always lock with `.map_err(|e| e.to_string())?`.

### Error Handling

- Tauri commands return `Result<T, String>`; convert all internal errors to `String` before returning.
- Within repositories use `rusqlite::Result<T>`; match on `rusqlite::Error::QueryReturnedNoRows` to return `Ok(None)` for optional lookups.
- Avoid `unwrap()` / `expect()` in non-startup code; use `?` propagation.

---

## Tauri IPC Conventions

- All Tauri commands are registered in `src-tauri/src/lib.rs` via `tauri::generate_handler![]`.
- Frontend calls go through `src/lib/api.ts`; never call `invoke()` directly in components or stores.
- Command names use `snake_case` on the Rust side; the TypeScript wrapper functions use `camelCase`.
- Structs serialised to the frontend use `#[serde(rename_all = "camelCase")]` so keys arrive in camelCase.
