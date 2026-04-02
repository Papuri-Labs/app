# Architecture Documentation

## Overview
**Papuri** is a multi-tenant church management system designed to streamline ministry coordination, member engagement, and administrative operations. The system leverages a modern serverless stack to provide real-time updates and scalable resource management.

---

## Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) (v18+) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first design.
- **UI Components**: custom-built glassmorphism components with Radix-inspired primitives.
- **State Management**: [Convex](https://www.convex.dev/) React hooks for real-time synchronization.
- **Routing**: [React Router](https://reactrouter.com/) (v6+) with organization-aware slug-based routing.
- **Authentication**: [Clerk](https://clerk.com/) for identity management.

### Backend & Database
- **Platform**: [Convex](https://www.convex.dev/)
- **Database**: Document-oriented (NoSQL) with relational-like indexing.
- **Functions**: Serverless TypeScript functions (Queries, Mutations, Actions).
- **Authentication**: Clerk integrated with Convex via JWT validation.

---

## Multi-Tenancy Architecture

The system implements multi-tenancy at the data layer through **Organization Isolation**:

1.  **Organization Table**: Every deployment revolves around an `organizations` record, identified by a unique `slug` (e.g., `/my-church/dashboard`).
2.  **Data Partitioning**: Almost every table (users, ministries, events, etc.) contains an `organizationId` field.
3.  **Scoped Queries**: All backend functions filters data by `organizationId` to ensure users only see data belonging to their specific church.
4.  **Dynamic Branding**: The UI dynamically fetches logo, colors, and site metadata based on the active organization's settings.

---

## Authentication & Authorization

### Clerk-Convex Integration
- **Identity**: Clerk handles the primary user identity and authentication flow.
- **Synchronization**: A standard synchronization pattern (often via webhooks or manual profile editing) links the Clerk `userId` to a record in the Convex `users` table.
- **Session Management**: Convex validates the Clerk JWT for every request, providing a secure `ctx.auth` object in server functions.

### Role-Based Access Control (RBAC)
The system enforces permissions through a centralized [permissions.ts](file:///Users/amielpaulpadillagonzales/Documents/ChurchFiles/my-magi/convex/permissions.ts) module.

| Role | Access Level | Primary Focus |
| :--- | :--- | :--- |
| **Newcomer** | Public | Onboarding, about church, service schedules. |
| **Member** | Private | Dashboards, assignments, ministry specific content. |
| **Leader** | Management | Ministry-specific data (attendance, assignments, bulletins). |
| **Admin** | Global | Organization settings, user management, system-wide stats. |

---

## Project Structure

### Frontend (`/src`)
- `components/`: UI library and layout components.
- `pages/`: Route-level components, including `RolePages.tsx` which groups role-specific views.
- `contexts/`: Global state providers for `Auth` and `ViewMode` (allowing admins to switch views).
- `hooks/`: Custom hooks for data fetching and shared UI logic.
- `lib/`: Utilities, tracing, and third-party configs.

### Backend (`/convex`)
- `schema.ts`: Centralized database schema and index definitions.
- `permissions.ts`: Core logic for RBAC and access validation.
- `_generated/`: Auto-generated types and API hooks.
- `[module].ts`: Business logic organized by domain (e.g., `users.ts`, `attendance.ts`, `events.ts`).

---

## Core Data Model (Excluding Financials)

| Table | Purpose |
| :--- | :--- |
| `organizations` | Root configuration for each tenant/church. |
| `users` | Profiles, roles, and ministry memberships. |
| `ministries` | Domain groups (e.g., Worship, Kids) for task delegation. |
| `assignments` | Task management for ministry members. |
| `attendance` | Real-time tracking of service/event participation. |
| `bulletins` | Scheduled church announcements and service flows. |
| `prayer_requests` | Community-shared prayer items with status tracking. |
| `settings` | Per-organization UI/UX parameters (logos, colours, thresholds). |

---

## Component Lifecycle & Real-time Sync
The application follows a **Reactive Architecture**:
1.  **Subscriptions**: The frontend uses `useQuery` hooks to subscribe to backend data.
2.  **Instant Updates**: Convex automatically pushes updates to all connected clients when an underlying mutation changes the data.
3.  **Optimistic UI**: (Optional Pattern) Mutations reflect changes immediately in the UI before server confirmation for a premium, snappy feel.
