# Components Reference

This document provides a comprehensive overview of the major React components and UI primitives in the myPM project. Each section details the component's purpose, props, usage, and design intent.

---

## Table of Contents

- [Main Components](#main-components)
  - [AuthProvider](#authprovider)
  - [MenuBar](#menubar)
  - [SidebarLayout](#sidebarlayout)
  - [PageHeader](#pageheader)
  - [UserProfile](#userprofile)
- [UI Primitives](#ui-primitives)
  - [Button](#button)
  - [Card](#card)
  - [Avatar](#avatar)
  - [Dialog](#dialog)
  - [Badge](#badge)
  - [Select](#select)
  - [Textarea](#textarea)
  - [Input](#input)
  - [Sheet](#sheet)
  - [DropdownMenu](#dropdownmenu)

---

## Main Components

### AuthProvider
- **Purpose:** Provides authentication context and logic to the app. Handles login, logout, and user session state.
- **Props:** `{ children: React.ReactNode }`
- **Usage:** Wrap your app with `<AuthProvider>`. Use the `useAuth` hook to access `{ user, loading, login, logout }`.
- **Design Intent:** Centralizes authentication logic and state, making it accessible throughout the app. Includes a `useRequireAuth` hook for route protection and permission checks.

### MenuBar
- **Purpose:** Top navigation bar with branding and sign-in/dashboard buttons.
- **Props:** `{ hideSignInButton?: boolean; hideNavLinks?: boolean; showLogoutOnly?: boolean }`
- **Usage:** Place at the top of your layout. Shows sign-in or dashboard button based on auth state.
- **Design Intent:** Provides consistent branding and entry point for authentication.

### SidebarLayout
- **Purpose:** Main app layout with a sidebar for navigation and a top bar for user info and logout.
- **Props:** `{ children: React.ReactNode }`
- **Usage:** Wrap dashboard pages with `<SidebarLayout>`. Sidebar links adapt to user role (admin, mentor, etc.).
- **Design Intent:** Responsive, role-aware navigation for the dashboard experience.

### PageHeader
- **Purpose:** Section header with icon, title, and optional subtitle.
- **Props:** `{ icon: React.ReactNode, title: string, subtitle?: string }`
- **Usage:** Place at the top of pages/sections for consistent headers.
- **Design Intent:** Visually separates sections and provides context.

### UserProfile
- **Purpose:** User profile page with avatar upload/cropping, basic info, and logout.
- **Props:** None (uses auth context internally).
- **Usage:** Used on the profile page. Handles avatar upload, cropping, and reset via API.
- **Design Intent:** User-friendly profile management with image cropping and cache-busting.

---

## UI Primitives

### Button
- **Purpose:** Reusable button component with variants and sizes.
- **Props:** All native `<button>` props, plus `variant` (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`), `size` (`default`, `sm`, `lg`, `icon`), and `asChild`.
- **Usage:** `<Button variant="secondary" size="lg">Click me</Button>`
- **Design Intent:** Consistent, accessible buttons with style variants for different actions.

### Card
- **Purpose:** Flexible card container with header, content, footer, etc.
- **Props:** All native `<div>` props for each subcomponent (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`).
- **Usage:**
  ```tsx
  <Card>
    <CardHeader>...</CardHeader>
    <CardContent>...</CardContent>
    <CardFooter>...</CardFooter>
  </Card>
  ```
- **Design Intent:** Modular, composable card layouts for displaying grouped content.

### Avatar
- **Purpose:** User avatar with image and fallback.
- **Props:** All props from `@radix-ui/react-avatar` for `Avatar`, `AvatarImage`, `AvatarFallback`.
- **Usage:**
  ```tsx
  <Avatar>
    <AvatarImage src="/path/to/img" />
    <AvatarFallback>AB</AvatarFallback>
  </Avatar>
  ```
- **Design Intent:** Consistent, accessible user avatars with fallback for missing images.

### Dialog
- **Purpose:** Modal dialog component with overlay, header, footer, etc.
- **Props:** All props from `@radix-ui/react-dialog` for each subcomponent.
- **Usage:**
  ```tsx
  <Dialog>
    <DialogTrigger>Open</DialogTrigger>
    <DialogContent>
      <DialogHeader>...</DialogHeader>
      <DialogFooter>...</DialogFooter>
    </DialogContent>
  </Dialog>
  ```
- **Design Intent:** Accessible, animated modal dialogs for forms, confirmations, etc.

### Badge
- **Purpose:** Small label for status, categories, or highlights.
- **Props:** All native `<div>` props, plus `variant` (`default`, `secondary`, `destructive`, `outline`).
- **Usage:** `<Badge variant="secondary">Mentor</Badge>`
- **Design Intent:** Visually highlight statuses or categories.

### Select
- **Purpose:** Custom select dropdown with groups, labels, and items.
- **Props:** All props from `@radix-ui/react-select` for each subcomponent.
- **Usage:**
  ```tsx
  <Select>
    <SelectTrigger>Choose...</SelectTrigger>
    <SelectContent>
      <SelectItem value="a">A</SelectItem>
      <SelectItem value="b">B</SelectItem>
    </SelectContent>
  </Select>
  ```
- **Design Intent:** Accessible, styled select menus for forms.

### Textarea
- **Purpose:** Styled textarea input.
- **Props:** All native `<textarea>` props.
- **Usage:** `<Textarea placeholder="Type here..." />`
- **Design Intent:** Consistent, accessible multi-line input.

### Input
- **Purpose:** Styled text input.
- **Props:** All native `<input>` props.
- **Usage:** `<Input type="email" placeholder="Email" />`
- **Design Intent:** Consistent, accessible single-line input.

### Sheet
- **Purpose:** Sliding panel (drawer) for side content.
- **Props:** All props from `@radix-ui/react-dialog` for each subcomponent, plus `side` (`top`, `right`, `bottom`, `left`).
- **Usage:**
  ```tsx
  <Sheet>
    <SheetTrigger>Open</SheetTrigger>
    <SheetContent side="right">...</SheetContent>
  </Sheet>
  ```
- **Design Intent:** Accessible, animated side panels for menus, forms, etc.

### DropdownMenu
- **Purpose:** Context menu/dropdown with items, groups, and submenus.
- **Props:** All props from `@radix-ui/react-dropdown-menu` for each subcomponent.
- **Usage:**
  ```tsx
  <DropdownMenu>
    <DropdownMenuTrigger>Open</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Item 1</DropdownMenuItem>
      <DropdownMenuItem>Item 2</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  ```
- **Design Intent:** Accessible, composable dropdown menus for actions and navigation.

---

For more details, see the code in `src/components/` and `src/components/ui/`. 