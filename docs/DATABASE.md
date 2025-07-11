# Database Models Reference

This document provides a comprehensive overview of all database models and enums defined in `prisma/schema.prisma` for the myPM project. Each section details the model's purpose, fields, relations, and usage in the application.

---

## Table of Contents

- [Models](#models)
  - [Group](#group)
  - [User](#user)
  - [Session](#session)
  - [MentoringSession](#mentoringsession)
  - [SessionAttendance](#sessionattendance)
  - [Onboarding](#onboarding)
- [Enums](#enums)
  - [Role](#role)
  - [GroupCategory](#groupcategory)
  - [AttendanceStatus](#attendancestatus)

---

## Models

### Group
- **Purpose:** Represents a mentoring group, including its mentor, mentees, category, and related sessions.
- **Fields:**
  - `id` (Int, PK): Internal numeric group ID (autoincremented)
  - `groupNumber` (Int, unique): Displayed group number, assigned manually
  - `category` (GroupCategory): Group category (e.g., CS_BSC_MENG)
  - `mentorId` (String, unique, optional): User ID of the mentor
  - `mentor` (User, optional): Mentor user (relation)
  - `mentees` (User[]): Mentees in the group (relation)
  - `info` (String, optional): Optional group resources/info
  - `mentoringSessions` (MentoringSession[]): Sessions for this group
- **Usage:** Used to organize users into groups for mentoring, assign mentors, and schedule group sessions.

### User
- **Purpose:** Represents a user (student, mentor, admin, etc.) with profile, role, group membership, onboarding, and session attendance.
- **Fields:**
  - `id` (String, PK): User ID (CUID)
  - `email` (String, unique): User email
  - `firstName` (String): First name
  - `lastName` (String): Last name
  - `upi` (String, unique): UCL Person Identifier
  - `studentId` (String, optional): Student ID
  - `staffId` (String, optional): Staff ID
  - `department` (String): Department
  - `role` (Role): User role (STUDENT, MENTOR, etc.)
  - `isActive` (Boolean): Whether the user is active
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
  - `profilePic` (String, optional): URL/path to profile picture
  - `sessions` (Session[]): Login sessions for this user
  - `onboarding` (Onboarding, optional): Onboarding data
  - `mentorGroup` (Group, optional): Group where user is mentor
  - `menteeOf` (Group, optional): Group where user is mentee
  - `menteeGroupId` (Int, optional): Foreign key for mentee group
  - `hostedSessions` (MentoringSession[]): Sessions hosted as mentor
  - `sessionAttendances` (SessionAttendance[]): Attendance records
- **Usage:** Central entity for authentication, authorization, group assignment, onboarding, and session tracking.

### Session
- **Purpose:** Represents a login session for a user (authentication/session management).
- **Fields:**
  - `id` (String, PK): Session ID (CUID)
  - `userId` (String): User ID (FK)
  - `token` (String, unique): Session token
  - `expiresAt` (DateTime): Expiry timestamp
  - `createdAt` (DateTime): Creation timestamp
  - `user` (User): User for this session (relation)
- **Usage:** Used for authentication and session management (login/logout).

### MentoringSession
- **Purpose:** Represents a scheduled mentoring event, linked to a group and mentor.
- **Fields:**
  - `id` (String, PK): Session ID (CUID)
  - `title` (String): Session title
  - `description` (String, optional): Session description
  - `date` (DateTime): Date of session
  - `startTime` (DateTime, optional): Start time
  - `endTime` (DateTime, optional): End time
  - `location` (String): Location
  - `isPublic` (Boolean): Public (true) or group-only (false)
  - `category` (GroupCategory): Category (inherited from group)
  - `maxCapacity` (Int, optional): Optional capacity limit
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
  - `mentorId` (String): Mentor user ID (FK)
  - `mentor` (User): Mentor user (relation)
  - `groupId` (Int): Group ID (FK)
  - `group` (Group): Group (relation)
  - `attendances` (SessionAttendance[]): Attendance records
- **Usage:** Used to schedule and manage mentoring events, track attendance, and associate with groups/mentors.

### SessionAttendance
- **Purpose:** Tracks a user's attendance for a mentoring session.
- **Fields:**
  - `id` (String, PK): Attendance record ID (CUID)
  - `status` (AttendanceStatus): Attendance status (REGISTERED, ATTENDED, etc.)
  - `createdAt` (DateTime): Creation timestamp
  - `updatedAt` (DateTime): Last update timestamp
  - `sessionId` (String): MentoringSession ID (FK)
  - `session` (MentoringSession): Session (relation)
  - `userId` (String): User ID (FK)
  - `user` (User): User (relation)
- **Usage:** Used to record and manage attendance for mentoring sessions. Enforces unique (sessionId, userId) pairs.

### Onboarding
- **Purpose:** Stores onboarding survey and quiz results for a user.
- **Fields:**
  - `id` (String, PK): Onboarding record ID (CUID)
  - `userId` (String, unique): User ID (FK)
  - `name` (String): Name
  - `degreeProgramme` (String): Degree programme
  - `gender` (String): Gender
  - `studiedCS` (Boolean): Whether user has studied CS
  - `yearsExperience` (Int): Years of experience
  - `quizAnswers` (Json): Quiz answers
  - `skillScore` (Int): Calculated skill score
  - `createdAt` (DateTime): Creation timestamp
  - `user` (User): User (relation)
- **Usage:** Used to track onboarding progress, quiz results, and skill assessment for new users.

---

## Enums

### Role
- **Values:** STUDENT, MENTOR, SENIOR_MENTOR, ADMIN, SUPERADMIN
- **Usage:** Determines user permissions and access throughout the app (RBAC).

### GroupCategory
- **Values:** CS_BSC_MENG, ROBOTICS_AI_MENG, CS_MATHS_MENG
- **Usage:** Categorizes groups and sessions by academic program.

### AttendanceStatus
- **Values:** REGISTERED, ATTENDED, ABSENT, CANCELLED
- **Usage:** Tracks attendance state for each session/user pair.

---

For more details, see the full schema in `prisma/schema.prisma` and the code in `src/app/` and `src/lib/`. 