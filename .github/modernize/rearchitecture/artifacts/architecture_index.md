# Architecture Index

This index is a navigation aid. This index is not the full contract. Do not implement from this file alone; follow the artifact paths below.

## Global artifacts

- `unit_graph.yaml`: entry points, source anchors, dependencies, and shared references. Filter by unit name.
- `wire_contracts.yaml`: HTTP/Stripe contracts and semantic details. Filter rows by `unit`.
- `shared_modules.yaml`: shared middleware, API client, session utilities, and inventory service. Filter rows by `used_by_units`.
- `cross_unit_state.yaml`: cookie/database state flows. Filter by `writer.unit` or `reader.unit`; runtime confirmation is required where marked.
- `project-structure.md`, `tech-stack.md`, `data-model.md`: global structure, existing stack, and persisted model views.

## Implementation Guide

Every unit below must read its `behavior.yaml`, `bindings.yaml`, and `unit_decomposition.yaml`. Candidate splits are advisory only because every decomposition file has `commit: false`.

| Unit | External trigger | Unit artifacts | Global rows to filter |
|---|---|---|---|
| auth-signup | POST /api/auth/signup | units/auth-signup/* | wire, shared, state by auth-signup |
| auth-signin | POST /api/auth/signin | units/auth-signin/* | wire, shared, state by auth-signin |
| auth-session | GET /api/auth/me | units/auth-session/* | wire, shared, state by auth-session |
| auth-recovery | password reset endpoints | units/auth-recovery/* | wire by auth-recovery |
| auth-oauth | Google/GitHub OAuth | units/auth-oauth/* | wire, shared, state by auth-oauth |
| hotel-registration | POST /api/hotels | units/hotel-registration/* | wire, shared by hotel-registration |
| room-catalog | GET /api/rooms | units/room-catalog/* | wire by room-catalog |
| room-owner-management | owner room endpoints | units/room-owner-management/* | wire, shared by room-owner-management |
| booking-availability | availability endpoint | units/booking-availability/* | wire, shared by booking-availability |
| booking-create | booking creation endpoint | units/booking-create/* | wire, shared by booking-create |
| booking-reads | user/hotel booking reads | units/booking-reads/* | wire, shared by booking-reads |
| payment-create | Stripe checkout creation | units/payment-create/* | wire, shared, state by payment-create |
| payment-webhook | Stripe webhook | units/payment-webhook/* | wire, shared, state by payment-webhook |
| payment-status | payment status reads | units/payment-status/* | wire, shared, state by payment-status |
| payment-reactivation | payment retry | units/payment-reactivation/* | wire, shared by payment-reactivation |
| user-profile | user profile read | units/user-profile/* | wire, shared, state by user-profile |
| user-search-history | recent search write | units/user-search-history/* | wire, shared, state by user-search-history |
| frontend-shell | SPA composition | units/frontend-shell/* | wire/shared by frontend-shell |
| frontend-auth | auth pages/context | units/frontend-auth/* | wire/shared by frontend-auth |
| frontend-discovery | discovery pages/context | units/frontend-discovery/* | wire/shared by frontend-discovery |
| frontend-bookings | booking page | units/frontend-bookings/* | wire/shared by frontend-bookings |
| frontend-payments | payment result pages | units/frontend-payments/* | wire/shared by frontend-payments |
| frontend-owner | owner pages | units/frontend-owner/* | wire/shared by frontend-owner |

## Completion evidence

For any later implementation, report: artifact paths read; each `must_preserve` behavior, branch, error, and contract implemented; unresolved/deferred runtime confirmations; and build/test/runtime evidence. Preserve the raw Stripe webhook boundary, JWT cookie flow, room/date inventory invariants, and protected-route behavior.
