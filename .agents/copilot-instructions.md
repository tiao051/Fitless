---
applyTo: "backend/Fitly.API/**/*.cs,frontend/fitly-app/src/**/*.{ts,tsx}"
---

# Fitly Project Manifesto & Foundational Guides

## Project Overview
Fitly is a cross-platform fitness application for workout logging, nutrition tracking, and social engagement.
- **Backend**: .NET 9, ASP.NET Core, EF Core 9.0, PostgreSQL.
- **Frontend**: React Native 0.81.5, Expo 54.0, TypeScript 5.9.

---

## Core Principles

1. **KISS (Keep It Simple, Stupid)**: Avoid over-engineering. Prioritize readable and maintainable code over complex abstractions.
2. **DRY (Don't Repeat Yourself)**: Centralize business logic (Volume/Macro formulas) in the Service Layer (Backend) or specialized Hooks (Frontend).
3. **SOLID**: Especially for Backend; use Single Responsibility and Dependency Injection for testability.
4. **YAGNI (You Ain't Gonna Need It)**: Do not write code for "future" features (Social/Wearables) until they are actively being developed.
5. **Clean Naming**: Use descriptive names (e.g., `CalculateTotalVolume` instead of `CalcVol`).
6. **TDD First (STRICT)**: Write unit tests **before** implementing features (xUnit for C#, Jest/Vitest for React Native).

---

## Engineering Standards

### Code Quality
- **Backend**: Follow C# PascalCase for methods/properties, camelCase for local variables. Use File-scoped namespaces.
- **Frontend**: Use Functional Components, Hooks, and descriptive naming. Follow React Native best practices.
- **Clean Code**: All code must be readable to junior developers without excessive comments.
- **No Emoji**: Production code and documentation must not contain emoji characters. Keep text clear and professional.

### Backend Standards
- Framework: ASP.NET Core with .NET 9
- Pattern: Controller-Service-Repository architecture with Primary Constructors & File-Scoped Namespaces
- Return `Result<T>` objects instead of throwing exceptions for business logic failures
- Use FluentValidation or Data Annotations for DTOs
- Auth: JWT-based with `JwtMiddleware`
- Testing: xUnit + Moq for Service logic
- Swagger/OpenAPI must be updated for every endpoint

### Frontend Standards
- Navigation: React Navigation 6.x
- State: Zustand (Local) + Async Storage (Caching)
- Styling: NativeWind (Tailwind CSS)
- Components: Keep small and reusable in `/src/components/ui`
- HTTP: Axios with JWT interceptors in base instance
- Testing: Jest + React Testing Library

---

## Project Context & Delivery

### Repository Structure
- **Monorepo-style**: Backend (`backend/Fitly.API`) + Frontend (`frontend/fitly-app`)
- Always use **relative paths** from workspace root
- Scripts in `scripts/`, infrastructure in `docker-compose.yml`, docs in `.github/`

### Single Source of Truth
- **Backend is authoritative**: Never duplicate business logic in frontend if API provides it
- Example: Calorie/macro calculations happen on backend only
- Frontend consumes APIs, **never hardcodes domain data**
- Use empty states instead of mock data in UI

### Feature Priority
1. **Workout Planning & Execution** (In-progress): Full API + DB + UI + Persistence cycle
2. **Nutrition Tracking** (Stable): Food search, meal logging, daily summaries
3. **Secondary Features** (Planned): Social, wearables, leaderboards — tackle **after** core flows complete

---

## Operational Rules (MANDATORY)

### Authentication & Security
- **Auth Safety**: Always handle `401 Unauthorized` states → redirect to login or show "Session Expired"
- **JWT Tokens**: Managed via `JwtService` on backend, stored securely via Async Storage on frontend
- Token expiration: Default 60 minutes, configurable
- **Validation**: DTOs validated server-side; never trust client input

### Database Operations
- **Idempotent Seeding**: All database seeders must be safe to run multiple times
  - Check if record exists before inserting (ExerciseSeeder, FoodSeeder)
  - Use deterministic lookups (name, external ID)
- **Foreign Keys**: All relationships must have constraints; no orphaned records
- **Async/Await**: All DB operations use async Task-based patterns

### Code Changes
- **Small PR Mindset**: Keep changes scoped to the specific task
- **No broad refactoring** without explicit permission
- **Ask-First Rule**: If requirement is ambiguous or has edge cases, **ask for clarification before coding**

### Testing Requirements
- **Backend**: Unit tests (xUnit) for Service logic + Controllers
- **Frontend**: Jest tests for screens & components with mocked API services
- Tests **must pass** before PR submission
- TDD-first: Write tests **before** implementation code

---

## Compliance Protocol (MANDATORY)

Every implementation response **must** conclude with this report:

1. **Instruction Coverage**: List which rules (KISS, TDD, etc.) were applied.
2. **KISS Gate**: If you added an Interface/Wrapper/Pattern, justify why simpler solution failed.
3. **Files Changed**: Exact file paths (relative to root).
4. **Verification Run**: Exact command to run (e.g., `dotnet test --filter ...` or `npx expo start`) and expected output.
5. **Assumptions**: Any assumptions made during implementation.

---

## Key Architectural Decisions

| Decision | Rationale | Implementation |
|----------|-----------|-----------------|
| Backend = Source of Truth | Prevent logic duplication, ensure consistency | APIs provide all calculations; FE consumes only |
| Service Layer Pattern | Testability, separation of concerns | `IExerciseService`, `IWorkoutService`, etc. |
| DTO Pattern | Decouple API contracts from domain models | Request/Response DTOs in every controller |
| EF Core + PostgreSQL | Type-safe, async-friendly ORM; durability | All models use FK constraints |
| JWT Authentication | Stateless, scalable auth | Custom `JwtService` + middleware validation |
| React Context (Auth) | Minimal state management overhead | `AuthContext` for global user session |
| Async Storage (FE Caching) | Offline support, better UX | Only for non-critical UI state |

---

## Fitness Domain Rules

### Calculations (Backend-Only)
- **Total Volume**: `Reps × Weight` per set, summed across session
- **Macros**: Calculated from Food entity (`Calories/Protein/Carbs/Fat per 100g` + `Quantity`)
- **Daily Summary**: Aggregation over all `NutritionLog` entries for a user/date

### Constraints
- **Reps/Weight**: Must be ≥ 0; validation on DTO level
- **Workout Sessions**: Only one "active" workout per user at a time (check DB before creation)
- **Streak**: Calculated as consecutive days with ≥1 completed workout

### Terminology
- **Workout Plan**: Weekly template (7 days)
- **Day Plan**: Single day within plan (with rest day flag)
- **Workout**: Completed session (has timestamp, duration)
- **Set**: Individual rep/weight instance within workout
- **Exercise**: Library item (name, body section, equipment)

---

## Related Skills & Guidance

Use the following skills for specialized guidance:
- `/backend-expert` — Detailed API/service patterns, authentication, testing
- `/mobile-expert` — React Native component & screen guidelines, state management
- `/fitness-logic` — Domain logic & calculation formulas, business rules
