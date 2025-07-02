# Role-Based Access Control (RBAC) Guide

This document outlines the implementation of Role-Based Access Control (RBAC) in the application and provides instructions on how to use it to manage user permissions.

## Overview

Our RBAC system is designed to control user access to different sections and features of the application based on pre-defined roles. The entire logic is centralized to ensure consistency and ease of maintenance.

### Key Files

-   `lib/authUtils.ts`: The core of the RBAC system. It defines roles, permissions, and the central `canAccess` function.
-   `app/dashboard/layout.tsx`: Implements the access control for the main navigation sidebar.

## Roles and Permissions

We have three defined user roles, each with a specific set of permissions. Permissions are managed by associating roles with the navigation paths they are allowed to see.

-   **`admin`**: Has unrestricted access to all sections of the dashboard.
-   **`operator`**: Can access Overview, AWS Files, Analytics, and Settings.
-   **`cleaner`**: Has the most limited access, confined to Overview, AWS Files, and Settings.

The permissions are defined in the `rolePermissions` object within `lib/authUtils.ts`. To modify permissions, simply update this object.

```typescript
// lib/authUtils.ts

const rolePermissions: Record<UserRole, string[]> = {
  admin: ['/dashboard', '/dashboard/aws-files', '/dashboard/analytics', '/dashboard/users', '/dashboard/settings'],
  operator: ['/dashboard', '/dashboard/aws-files', '/dashboard/analytics', '/dashboard/settings'],
  cleaner: ['/dashboard', '/dashboard/aws-files', '/dashboard/settings'],
};
```

## The `canAccess` Function

The `canAccess(role, path)` function is the heart of our permission-checking logic.

-   **`role`**: The user's role (e.g., 'admin', 'operator').
-   **`path`**: The URL path of the page or section to check (e.g., '/dashboard/users').

It returns `true` if the user has access and `false` if they do not. The `admin` role will always return `true`.

## How to Use

The system is already configured to hide and show navigation links in the dashboard sidebar. However, you can also use the `canAccess` function to protect pages from direct URL access or to conditionally render specific UI components.

### Example: Conditionally Rendering a Button

To show a component only to users with a specific permission, you would first need access to the user's role. In `app/dashboard/layout.tsx`, the `userRole` is available in the state. You would need to pass this role down to child components or use a shared state management solution (like React Context) for wider availability.

Once you have the `userRole`, you can do the following:

```jsx
import { canAccess } from '@/lib/authUtils';

// Assume 'userRole' is passed as a prop or from context
function MyPageComponent({ userRole }) {

  // We want to show a button that only admins and operators can see.
  // The button navigates to '/dashboard/analytics'.
  const hasAccessToAnalytics = canAccess(userRole, '/dashboard/analytics');

  return (
    <div>
      <h1>My Page</h1>
      {hasAccessToAnalytics && (
        <Button>View Analytics</Button>
      )}
      <p>Other page content here...</p>
    </div>
  );
}
```

This ensures that UI elements related to restricted sections are not just hidden but are not rendered in the DOM at all for unauthorized users. 