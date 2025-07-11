# Utilities Reference

This document provides a comprehensive overview of all utility modules in the `src/lib/` directory of the myPM project. Each section details the module's purpose, main functions/classes, parameters, return values, and usage in the application.

---

## Table of Contents

- [auth.ts](#authts)
- [db.ts](#dbts)
- [rbac.ts](#rbacts)
- [ucl-api.ts](#ucl-apits)
- [r2.ts](#r2ts)
- [utils.ts](#utilsts)
- [prisma-reset.ts](#prisma-resetts)

---

## auth.ts
- **Purpose:** Handles authentication, session management, and user creation.
- **Key Functions:**
  - `createSession(uclUser: UCLUser): Promise<string>`: Creates a user (if needed) and a session JWT, stores it in the DB.
  - `verifySession(token: string): Promise<AuthUser | null>`: Verifies a session token, returns user info if valid.
  - `deleteSession(token: string): Promise<void>`: Deletes a session from the DB.
  - `determineUserRole(uclUser: UCLUser): UserRole`: Determines user role based on UCL groups.
  - `logDeniedAccess({ user, route, reason })`: Logs denied access attempts for auditing.
- **Usage:** Used in API routes for login, session validation, and access control.

## db.ts
- **Purpose:** Provides a singleton Prisma client for database access.
- **Key Export:**
  - `db`: The Prisma client instance.
- **Usage:** Imported wherever database access is needed. Handles connection reuse and cleanup.

## rbac.ts
- **Purpose:** Implements role-based access control (RBAC) for users.
- **Key Exports:**
  - `PERMISSIONS`: Permission constants (e.g., `USER_READ`, `SESSION_CREATE`).
  - `ROLE_PERMISSIONS`: Maps roles to allowed permissions.
  - `hasPermission(userRole, permission)`: Checks if a role has a specific permission.
  - `getUserPermissions(role)`: Returns all permissions for a role.
- **Usage:** Used in API routes and hooks to enforce access control.

## ucl-api.ts
- **Purpose:** Integrates with the UCL API for OAuth login and user info.
- **Key Class:**
  - `UCLAPIClient`: Handles OAuth URL generation, token exchange, and user info retrieval.
  - `uclApiClient`: Singleton instance for use in the app.
- **Key Methods:**
  - `getAuthUrl(redirectUri, state?)`: Returns the UCL OAuth URL.
  - `exchangeCodeForToken(code, redirectUri)`: Exchanges code for access token.
  - `getUserInfo(accessToken)`: Fetches user info from UCL API.
  - `verifyToken(token)`: Checks if a token is valid.
- **Usage:** Used in auth API routes for login and callback.

## r2.ts
- **Purpose:** Handles file storage (profile pictures) using S3-compatible R2 storage.
- **Key Functions:**
  - `uploadProfilePic(upi, buffer, contentType?)`: Uploads a profile picture.
  - `getProfilePic(upi)`: Retrieves a profile picture as a buffer.
  - `deleteProfilePics(upi)`: Deletes all profile pictures for a UPI.
- **Usage:** Used in user/profile-pic API endpoints and components.

## utils.ts
- **Purpose:** General-purpose utility functions for the app.
- **Key Function:**
  - `cn(...inputs)`: Merges Tailwind and clsx class names for conditional styling.
- **Usage:** Used throughout UI components for class name management.

## prisma-reset.ts
- **Purpose:** Utility to reset the Prisma database connection.
- **Key Function:**
  - `resetDatabaseConnection()`: Disconnects and reconnects the Prisma client.
- **Usage:** Used for development or error recovery to reset DB connection.

---

For more details, see the code in `src/lib/`. 