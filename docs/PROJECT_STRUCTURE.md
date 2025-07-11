# myPM Project Documentation

## Overview

myPM is a full-stack web application built with Next.js, TypeScript, and Prisma ORM, designed to manage mentoring groups, sessions, onboarding, and user roles for an academic or professional mentoring program. The project features a modular architecture, robust API endpoints, and a well-structured database schema to support user management, group assignments, session scheduling, and onboarding workflows.

## Directory Structure

```
.
├── prisma/           # Database schema and migrations
├── public/           # Static assets (images, icons, etc.)
├── src/
│   ├── app/          # Next.js app directory (routing, pages, API endpoints)
│   ├── components/   # React components (UI, layouts, shared logic)
│   ├── lib/          # Server-side utilities, authentication, and business logic
│   └── types/        # TypeScript type definitions
├── package.json      # Project dependencies and scripts
├── README.md         # Basic setup and Next.js info
└── ...               # Config files, changelogs, etc.
```

### Key Folders

- **prisma/**: Contains `schema.prisma` (database models) and `migrations/` (migration history).
- **public/**: Static files served directly by Next.js.
- **src/app/**: Main application logic, including:
  - `api/`: All backend API endpoints, organized by feature (auth, user, sessions, onboarding, admin, assistant).
  - `dashboard/`: Frontend dashboard pages for different user roles and features.
  - Other folders for login, onboarding, group admin, and profile pages.
- **src/components/**: Shared React components, including UI primitives (`ui/`), layout, and feature-specific components.
- **src/lib/**: Utility modules for authentication, database access, RBAC, external APIs, and helper functions.
- **src/types/**: Centralized TypeScript types for users, auth, and more.

## API Endpoints

All API routes are under `src/app/api/`, grouped by feature:

- **auth/**: Authentication (login, logout, callback)
- **user/**: User profile, group info, profile picture
- **sessions/**: Mentoring session management and attendance
- **onboarding/**: Onboarding workflow and status
- **admin/**: Admin endpoints for managing users and groups
- **assistant/**: AI assistant integration (e.g., Claude)

Each endpoint is implemented as a `route.ts` file, with RESTful conventions and Next.js API routing.

## Database Models

Defined in `prisma/schema.prisma`:

- **User**: Core user profile, role, group membership, onboarding, and session attendance
- **Group**: Mentoring group, mentor, mentees, and category
- **Session**: User login sessions (for authentication)
- **MentoringSession**: Scheduled mentoring events, linked to groups and mentors
- **SessionAttendance**: Tracks user attendance for mentoring sessions
- **Onboarding**: Onboarding survey and quiz results for users
- **Enums**: `Role`, `GroupCategory`, `AttendanceStatus`

## Components

Located in `src/components/`:

- **AuthProvider**: Authentication context provider
- **MenuBar, SidebarLayout, PageHeader**: Layout and navigation
- **UserProfile, OnboardingRedirector**: Feature-specific logic
- **ui/**: Reusable UI primitives (Button, Card, Dialog, Input, Select, etc.)

## Utilities (lib/)

- **auth.ts**: Authentication logic (session, login, etc.)
- **db.ts**: Database connection and helpers
- **rbac.ts**: Role-based access control
- **ucl-api.ts**: Integration with external UCL API
- **r2.ts**: File storage utilities
- **utils.ts**: Miscellaneous helpers
- **prisma-reset.ts**: Database reset scripts

## Getting Started

See the [README.md](../README.md) for basic setup. In summary:

1. Install dependencies: `npm install`
2. Set up your `.env` file with database and API credentials
3. Run database migrations: `npx prisma migrate deploy`
4. Start the development server: `npm run dev`
5. Access the app at [http://localhost:3000](http://localhost:3000)

## Architecture Notes

- **Next.js App Router**: Uses the new app directory structure for routing and API endpoints.
- **Prisma ORM**: Strongly-typed database access and migrations.
- **RBAC**: Fine-grained role-based access control for users, mentors, admins, and superadmins.
- **Onboarding Flow**: Custom onboarding logic and survey for new users.
- **Session Management**: Secure login sessions and attendance tracking for mentoring events.
- **Extensible**: Modular codebase for easy addition of new features, endpoints, and UI components.

---

For more details, see the code comments and individual module documentation. 