# ADR-006: Mobile State Management — React Context + React Query

**Status:** Accepted
**Date:** 2026-03-21
**Context:** Mobile app (React Native + Expo)

## Decision

Use **React Context** for auth/global state and **@tanstack/react-query** for server state management. Do not use Redux, Zustand, or other external state libraries.

## Context

The mobile app was scaffolded with `@reduxjs/toolkit`, `react-redux`, and `zustand` as dependencies, but none were ever imported or used. All state management uses:

- `AuthContext` — authentication tokens, user session
- `OnboardingContext` — onboarding flow state
- `SpacesContext` (via `useSpaces` hook) — active space selection
- `@tanstack/react-query` — all API data fetching, caching, and synchronization

## Rationale

- **React Query handles 90% of state**: Server cache, loading/error states, background refetching, and optimistic updates are all built in. Adding Redux on top would duplicate this.
- **Context is sufficient for global client state**: Auth tokens and space selection are the only truly global client state. These change infrequently and don't cause performance issues with Context.
- **Smaller bundle**: Removing three unused libraries reduces the JS bundle by ~45KB (minified).
- **Simpler mental model**: One pattern for server state (React Query), one for client state (Context). No action creators, reducers, selectors, or store configuration.

## Consequences

- If the app grows to need complex client-side state (e.g., offline-first with conflict resolution), reconsider Zustand or Redux Toolkit.
- Developers should default to React Query for any data that comes from the API.
- Use Context only for truly global, infrequently-changing client state.
