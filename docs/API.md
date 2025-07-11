# API Reference

This document provides a comprehensive overview of all API endpoints in the myPM project, grouped by feature. Each section details the endpoint's purpose, supported HTTP methods, input/output, authentication/authorization, and any special notes.

---

## Table of Contents

- [Auth Endpoints](#auth-endpoints)
- [User Endpoints](#user-endpoints)
- [Sessions Endpoints](#sessions-endpoints)
- [Onboarding Endpoints](#onboarding-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Assistant Endpoints](#assistant-endpoints)

---

## Auth Endpoints

### `GET /api/auth/login`
- **Purpose:** Initiates the UCL OAuth login flow. Redirects the user to the UCL login page.
- **Input:** Optional `redirect` query param (where to redirect after login).
- **Output:** HTTP redirect to UCL login.
- **Auth:** None.

### `GET /api/auth/callback`
- **Purpose:** Handles the OAuth callback from UCL, exchanges code for token, creates a session, and redirects to the app.
- **Input:** `code`, `state`, `result` query params from UCL.
- **Output:** HTTP redirect to dashboard or error page. Sets session cookie.
- **Auth:** None (public endpoint, but only called by UCL after login).

### `POST /api/auth/logout`
- **Purpose:** Logs out the user by deleting their session and clearing the session cookie.
- **Input:** None.
- **Output:** `{ success: true }`
- **Auth:** Requires valid session cookie.

---

## User Endpoints

### `GET /api/user`
- **Purpose:** Returns the authenticated user's profile.
- **Input:** None.
- **Output:** `{ user: { ... } }` (user object)
- **Auth:** Requires valid session. Role must have `user:read` permission.

### `POST /api/user`
- **Purpose:** Updates the authenticated user's profile picture.
- **Input:** `multipart/form-data` with `profilePic` file.
- **Output:** `{ success: true }` or error.
- **Auth:** Requires valid session. Role must have `user:update` permission.

### `DELETE /api/user`
- **Purpose:** Deletes the authenticated user's profile picture.
- **Input:** None.
- **Output:** `{ success: true }` or error.
- **Auth:** Requires valid session. Role must have `user:update` permission.

#### `GET /api/user/group`
- **Purpose:** Returns the group for the authenticated user (as mentor or mentee). Admins can get all groups with `?all=1`.
- **Input:** Optional `all=1` query param.
- **Output:** `{ group: { ... } }` or `{ groups: [ ... ] }`
- **Auth:** Requires valid session. Role must have `user:read` permission.

#### `POST /api/user/group`
- **Purpose:** Updates the group info for the group where the user is mentor.
- **Input:** JSON body: `{ info: string }`
- **Output:** `{ success: true }` or error.
- **Auth:** Requires valid session. User must be mentor of the group.

#### `GET /api/user/profile-pic/[upi]`
- **Purpose:** Returns the profile picture for the user with the given UPI, or generates an avatar if not found.
- **Input:** Path param: `upi` (user's UPI)
- **Output:** PNG image or 304 if cached.
- **Auth:** Requires valid session.

---

## Sessions Endpoints

### `GET /api/sessions`
- **Purpose:** Returns mentoring sessions for the authenticated user.
- **Input:** None.
- **Output:** `{ sessions: [ ... ] }` (list of sessions)
- **Auth:** Requires valid session. Role must have `user:read` permission.

### `POST /api/sessions`
- **Purpose:** Creates a new mentoring session (mentors only).
- **Input:** JSON body: `{ title, description, date, startTime, endTime, location, isPublic, maxCapacity }`
- **Output:** `{ session: { ... } }` or error.
- **Auth:** Requires valid session. User must be a mentor.

#### `GET /api/sessions/[id]`
- **Purpose:** Returns details for a specific mentoring session.
- **Input:** Path param: `id` (session ID)
- **Output:** `{ session: { ... } }` or error.
- **Auth:** Requires valid session. User must be authorized to view the session.

#### `DELETE /api/sessions/[id]`
- **Purpose:** Deletes a mentoring session (mentors only, must own the session).
- **Input:** Path param: `id` (session ID)
- **Output:** `{ success: true }` or error.
- **Auth:** Requires valid session. User must be the mentor for the session.

#### `PUT /api/sessions/[id]/attendance`
- **Purpose:** Updates attendance for a session (mentors only).
- **Input:** Path param: `id` (session ID), JSON body with attendance data.
- **Output:** `{ success: true }` or error.
- **Auth:** Requires valid session. User must be a mentor.

---

## Onboarding Endpoints

### `POST /api/onboarding`
- **Purpose:** Submits onboarding data and quiz answers for the authenticated user.
- **Input:** JSON body: `{ name, degreeProgramme, gender, studiedCS, yearsExperience, quizAnswers }`
- **Output:** `{ success: true, skillScore }` or error.
- **Auth:** Requires valid session. Role must have `user:update` permission.

### `GET /api/onboarding/status`
- **Purpose:** Checks if the authenticated user has completed onboarding.
- **Input:** None.
- **Output:** `{ onboarded: boolean }` or error.
- **Auth:** Requires valid session. Role must have `user:read` permission.

---

## Admin Endpoints

### `GET /api/admin/users`
- **Purpose:** Returns a list of all users (admin roles only).
- **Input:** None.
- **Output:** `{ users: [ ... ] }`
- **Auth:** Requires valid session. Role must be ADMIN, SENIOR_MENTOR, or SUPERADMIN.

### `GET /api/admin/groups`
- **Purpose:** Returns a list of all groups (admin roles only).
- **Input:** None.
- **Output:** `{ groups: [ ... ] }`
- **Auth:** Requires valid session. Role must be ADMIN, SENIOR_MENTOR, or SUPERADMIN.

### `POST /api/admin/groups`
- **Purpose:** Creates a new group (admin roles only).
- **Input:** None (group number auto-incremented, default category).
- **Output:** `{ group: { ... } }`
- **Auth:** Requires valid session. Role must be ADMIN, SENIOR_MENTOR, or SUPERADMIN.

---

## Assistant Endpoints

### `POST /api/assistant/claude`
- **Purpose:** Sends a message to the Claude AI assistant and returns a completion.
- **Input:** JSON body: `{ messages: [ { role, content } ] }`
- **Output:** `{ completion: string }` or error.
- **Auth:** Optional. If authenticated, session and group context is included in the prompt.
- **Special Notes:** Integrates with Anthropic Claude API. Returns available and registered sessions for the user as context.

---

For more details on each endpoint, see the code in `src/app/api/` and the RBAC logic in `src/lib/rbac.ts`. 