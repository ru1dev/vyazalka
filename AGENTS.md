# Repository Guidelines

## Project Structure & Module Organization

This is a React + TypeScript + Vite application. Source code lives in `src/`.
The main app shell is in `src/app/`, project data models and repositories are in
`src/entities/project/`, feature UI lives in `src/features/`, and reusable domain
logic is in `src/shared/domain/`. Shared UI primitives are in `src/shared/ui/`.
Unit tests are colocated with the code as `*.test.ts` or `*.test.tsx`.

## Build, Test, and Development Commands

- `npm install` installs dependencies.
- `npm run dev` starts the Vite development server.
- `npm run build` runs TypeScript project checks and creates `dist/`.
- `npm run preview` serves the production build locally.
- `npm run test` runs the Vitest suite once.
- `npm run test:watch` runs Vitest in watch mode.

Use `npm run build` before deployment. Cloudflare deployment uses
`npm run deploy:cloudflare`.

## Coding Style & Naming Conventions

Use TypeScript with strict types. Keep domain calculations outside React
components, usually under `src/shared/domain/`. UI components should consume
prepared data rather than duplicating formulas. Use PascalCase for React
components (`ProjectEditor.tsx`) and camelCase for functions (`calculateShapingPlan`).

Prefer small, explicit helpers over hidden side effects. Store user-facing strings
in Russian, matching the current product language. Keep CSS styling in Tailwind
classes unless a shared component is more appropriate.

## Testing Guidelines

Vitest is the test runner, with `jsdom` and Testing Library for React tests.
Domain logic should have focused unit tests, especially for gauge conversion,
shaping distribution, project persistence, and pattern calculations. Name tests
next to the implementation, for example `sleevelessDressCalculations.test.ts`.

Run `npm run test` after changing formulas, repositories, or error handling.
Run `npm run build` after TypeScript model changes.

## Architecture Notes

Project persistence goes through repository interfaces in
`src/entities/project/`; the current implementation uses Dexie/IndexedDB and is
designed to be replaceable by an API repository later. Pattern diagrams are
declarative: calculators produce result data, mappers convert it to
`PatternPiece[]`, and `PatternDiagram` renders those pieces without knitting
business logic.

## Commit & Pull Request Guidelines

Recent commits use short imperative summaries, for example
`Add sleeveless dress pattern type` and `Introduce generic pattern diagram engine`.
Keep commits scoped to one feature or fix. Pull requests should include a concise
description, test/build results, and screenshots for visible UI changes.
