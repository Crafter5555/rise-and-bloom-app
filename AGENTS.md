# AGENTS.md

- Core app lives in `src/iron/` (store, ui, pages): Protocol, Training, Actions, Board, Stats. Why: one small, mobile-only surface replaced the old sprawling pages.
- App data is held in a single on-device store (`src/iron/store.tsx`, localStorage key `iron.v1`). Why: keeps the app simple and offline; move to cloud sync later if accounts/sync are needed.
- Pure calculations (counter periods, streaks) live as exported helpers in the store so they can be tested.
- Styling uses only semantic tokens; the active theme is the override block at the end of `src/index.css`.
