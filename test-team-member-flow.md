# Team Member Onboarding Flow Test

## Issue Fixed
When a team member receives an invite to join an existing organization, they were being sent to the new organization onboarding flow instead of the team member profile completion flow.

## Changes Made

### 1. Updated `/api/auth/check-onboarding/route.ts`
- Added logic to distinguish between organization onboarding and user profile completion
- New fields: `needsOrganizationOnboarding` and `needsUserProfileCompletion`
- Team members with `status: 'PENDING'` and existing organization are routed to user profile completion

### 2. Updated `/app/auth/signin/page.tsx`
- Modified routing logic to prioritize user profile completion over organization onboarding
- Team members now go to `/onboarding/user` instead of `/onboarding`

### 3. Updated `/app/auth/callback/page.tsx`
- Added onboarding type checking in both authentication flows
- Team members are properly routed to user onboarding

### 4. Updated `/middleware.ts`
- Added `/onboarding/user` to the onboarding routes list

## Test Scenario
1. Admin invites team member with email `teammate@isemediaagency.com`
2. Team member receives email with login link
3. Team member clicks link and signs in with temporary password
4. System should route to `/onboarding/user` (team member flow) instead of `/onboarding` (organization flow)

## Expected Behavior
- Team members with `status: 'PENDING'` and existing `organizationId` → `/onboarding/user`
- New organization owners without organization → `/onboarding`
- Active users → `/dashboard`

## Files Modified
- `src/app/api/auth/check-onboarding/route.ts`
- `src/app/auth/signin/page.tsx`
- `src/app/auth/callback/page.tsx`
- `src/middleware.ts` 