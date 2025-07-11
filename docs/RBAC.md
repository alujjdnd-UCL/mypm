# Role-Based Access Control (RBAC) Reference

This document provides a comprehensive overview of the RBAC (role-based access control) system in the myPM project. It covers how roles are defined, how permissions are mapped, how checks are performed, and where RBAC is enforced in the app.

---

## Table of Contents

- [Overview](#overview)
- [Roles](#roles)
- [Permissions](#permissions)
- [Role-Permission Mapping](#role-permission-mapping)
- [Permission Checks](#permission-checks)
- [Enforcement Points](#enforcement-points)

---

## Overview

RBAC is used throughout the myPM project to control access to API endpoints, UI features, and sensitive actions. Each user is assigned a role, and each role is mapped to a set of permissions. Permission checks are performed in both backend API routes and frontend hooks.

---

## Roles
- **Defined in:** `prisma/schema.prisma` (enum `Role`), `src/types/auth.ts`
- **Roles:**
  - `STUDENT`: Default for most users
  - `MENTOR`: Can host sessions, manage mentees
  - `SENIOR_MENTOR`: Elevated mentor with more permissions
  - `ADMIN`: Administrative privileges
  - `SUPERADMIN`: Highest level, full access

---

## Permissions
- **Defined in:** `src/lib/rbac.ts` (`PERMISSIONS`)
- **Examples:**
  - `USER_READ`, `USER_UPDATE`, `USER_DELETE`
  - `ADMIN_READ`, `ADMIN_WRITE`
  - `SESSION_READ`, `SESSION_CREATE`, `SESSION_UPDATE`, `SESSION_DELETE`, `SESSION_MANAGE_ATTENDANCE`
  - `TIMETABLE_READ`, `TIMETABLE_WRITE`

---

## Role-Permission Mapping
- **Defined in:** `src/lib/rbac.ts` (`ROLE_PERMISSIONS`)
- **Mapping:** Each role is mapped to a set of permissions. For example:
  - `STUDENT`: Can read/update own user info, read sessions, read timetable
  - `MENTOR`: All student permissions plus create/update/delete sessions, manage attendance, write timetable
  - `ADMIN`/`SUPERADMIN`: All permissions, including admin actions

---

## Permission Checks
- **Function:** `hasPermission(userRole, permission)` in `src/lib/rbac.ts`
- **Usage:**
  - Backend: API routes check permissions before performing actions
  - Frontend: Hooks like `useRequireAuth` enforce permissions for page access
- **Example:**
  ```ts
  if (!hasPermission(user.role, PERMISSIONS.USER_UPDATE)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  ```

---

## Enforcement Points
- **API Endpoints:** All sensitive API routes check permissions using RBAC before allowing access or mutations
- **UI/Pages:** Frontend hooks and components use RBAC to show/hide features and redirect unauthorized users
- **Logging:** Denied access attempts are logged for auditing (`logDeniedAccess` in `auth.ts`)

---

For more details, see the code in `src/lib/rbac.ts`, `src/types/auth.ts`, and the `Role` enum in `prisma/schema.prisma`. 