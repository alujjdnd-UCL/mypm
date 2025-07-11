# Dashboard & Page Structure Reference

This document provides a comprehensive overview of the main dashboard and page structure in the myPM project, focusing on the contents of `src/app/dashboard/`. Each section details the page's purpose, main features, user roles, and its role in the overall user experience.

---

## Table of Contents

- [Dashboard Landing Page](#dashboard-landing-page)
- [Assistant Page](#assistant-page)
- [Sessions Page](#sessions-page)
- [Mentor Sessions Page](#mentor-sessions-page)
- [My Group Page](#my-group-page)

---

## Dashboard Landing Page
- **Path:** `/dashboard`
- **Purpose:** Main entry point for authenticated users. Welcomes the user, shows announcements, and provides quick links to key features.
- **Main Features:**
  - Welcome message and branding
  - Announcements section
  - Action cards for "My Group", "My Sessions", "Resources", and "My Profile"
  - Debug view (for development)
- **User Roles:** All authenticated users
- **User Experience:** Central hub for navigation and updates.

## Assistant Page
- **Path:** `/dashboard/assistant`
- **Purpose:** Smart AI assistant chat interface for session suggestions, booking, and help.
- **Main Features:**
  - Chat interface with streaming responses
  - Session suggestions and booking
  - Markdown rendering and session details dialogs
- **User Roles:** All authenticated users
- **User Experience:** Personalized, conversational help and session management.

## Sessions Page
- **Path:** `/dashboard/sessions`
- **Purpose:** View, join, and manage mentoring sessions as a student.
- **Main Features:**
  - Calendar and list views of sessions
  - Join/register for sessions
  - Session details dialogs
  - Filtering by week and category
- **User Roles:** Students (mentees)
- **User Experience:** Easy discovery and registration for available sessions.

## Mentor Sessions Page
- **Path:** `/dashboard/mentor-sessions`
- **Purpose:** Manage sessions as a mentor (create, edit, delete, track attendance).
- **Main Features:**
  - List and calendar of sessions
  - Create/edit/delete sessions
  - Attendance management dialogs
  - Session details and editing forms
- **User Roles:** Mentors, Senior Mentors, Admins, Superadmins
- **User Experience:** Full control over session scheduling and attendance for mentors.

## My Group Page
- **Path:** `/dashboard/my-group`
- **Purpose:** View details about the user's assigned mentor group.
- **Main Features:**
  - Group info (number, mentor, mentees)
  - Mentor and mentee profiles
  - Editable group info for mentors
  - Error and loading states for unassigned users
- **User Roles:** All users (with group assignment)
- **User Experience:** Central place to see group membership and mentor contact info.

---

For more details, see the code in `src/app/dashboard/` and the main layout in `src/components/SidebarLayout.tsx`. 