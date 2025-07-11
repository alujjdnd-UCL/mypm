# Onboarding Flow Reference

This document provides a comprehensive overview of the onboarding flow in the myPM project, including the UI, API, and database integration. Each section details the stepper UI, API logic, onboarding model, and how onboarding status is checked and updated.

---

## Table of Contents

- [Overview](#overview)
- [UI Flow](#ui-flow)
- [API Logic](#api-logic)
- [Database Model](#database-model)
- [Status Checking](#status-checking)

---

## Overview

The onboarding flow guides new users through a multi-step process to collect personal details, profile picture, experience, and quiz answers. It ensures users are properly profiled before accessing the main dashboard.

---

## UI Flow
- **Location:** `src/app/onboarding/page.tsx`
- **Steps:**
  1. Personal Details (name, UPI, degree, gender)
  2. Profile Picture (optional upload)
  3. Experience (studied CS, years of experience)
  4. Coding Quiz (multiple choice)
  5. Completion
- **Features:**
  - Stepper UI with progress
  - Pre-population from user context
  - Profile picture upload and preview
  - Quiz with dummy questions
  - Animated transitions between steps
  - Calls API to submit data and upload profile picture
- **Access Control:** Requires authentication and `user:update` permission

---

## API Logic
- **Location:** `src/app/api/onboarding/route.ts`
- **POST /api/onboarding:**
  - Authenticates user and checks `user:update` permission
  - Accepts JSON body: `{ name, degreeProgramme, gender, studiedCS, yearsExperience, quizAnswers }`
  - Calculates a `skillScore` based on quiz answers and experience
  - Upserts onboarding data in the database
  - Returns `{ success: true, skillScore }`
- **Status Check:**
  - `GET /api/onboarding/status` returns `{ onboarded: boolean }` based on DB record

---

## Database Model
- **Location:** `prisma/schema.prisma` (model `Onboarding`)
- **Fields:**
  - `id`: Onboarding record ID (CUID)
  - `userId`: User ID (unique, FK)
  - `name`: Name
  - `degreeProgramme`: Degree programme
  - `gender`: Gender
  - `studiedCS`: Boolean
  - `yearsExperience`: Integer
  - `quizAnswers`: JSON
  - `skillScore`: Integer
  - `createdAt`: Timestamp
- **Relations:** Linked to `User` (one-to-one)

---

## Status Checking
- Onboarding page checks `/api/onboarding/status` on load
- If `onboarded: true`, user is redirected to dashboard
- Onboarding data is upserted on completion

---

For more details, see the code in `src/app/onboarding/`, `src/app/api/onboarding/`, and the `Onboarding` model in `prisma/schema.prisma`. 