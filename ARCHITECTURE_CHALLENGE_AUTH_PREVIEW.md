# Architecture Challenge: Auth Preview Mode for Learning Center GIF Recording

## Problem Statement

Learning Center GIF recording requires capturing both authenticated and unauthenticated user flows. Admin users recording GIFs for onboarding tutorials must be able to demonstrate unauthenticated experiences (landing page, guest signup flow) without losing admin access to recording tools.

## Current Architecture

### AuthPreviewContext System

- **Location**: `src/contexts/AuthPreviewContext.tsx`
- **Purpose**: Provides centralized auth preview mode that overrides `user` and `session` to `null` when `?_preview_auth=false` is present in URL
- **Admin Protection**: Admin routes (e.g., `/updates?tab=admin`) ignore preview mode and always use real authentication
- **Components Using It**:
  - `Navbar.tsx` - Conditionally shows auth/unauth navigation
  - `Landing.tsx` - Shows hero upload section vs "Welcome back" for authenticated users
  - `Index.tsx` - May show different UI based on auth state

### GIF Recording with Screen Capture API

- **Hook**: `useGifRecorder.ts`
- **Method**: Uses `navigator.mediaDevices.getDisplayMedia()` to capture actual screen/tab/window pixels
- **Component**: `GifRecordingPanel.tsx`
- **Key Limitation**: **Records actual browser tab selected by user**, not iframe content

## The Catch-22

1. Admin opens `/updates?tab=admin` (authenticated)
2. Admin clicks "Record GIF" for a learning step (e.g., "First receipt scan for unauthenticated users")
3. Admin needs to record the unauthenticated landing page experience
4. **Problem**: Screen Capture API captures the actual tab the admin selects during recording
5. **Solution Attempted**: `?_preview_auth=false` makes components *render* as if user is logged out
6. **Limitation**: This only works for components that check `useAuthPreview()` - not all components do yet

## Current Solution (Partial)

### What Works

1. Admin can open target page (e.g., `/` landing) with `?_preview_auth=false` in a separate tab
2. Components that use `useAuthPreview()` correctly show unauthenticated UI
3. Admin recording tools remain accessible on `/updates?tab=admin` (admin routes ignore preview mode)
4. Screen Capture API can record the separate tab showing unauthenticated UI

### What's Incomplete

1. **Not all auth-aware components use `useAuthPreview()` yet** - many still directly use `useAuth()`
2. Some components may still show authenticated UI even with `?_preview_auth=false`
3. User must manually open target page in separate tab with preview parameter

## Action Items to Complete Implementation

### High Priority: Audit and Update Components

Search for all components using `useAuth()` and determine if they should respect preview mode:

```bash
# Components already updated:
✅ Navbar.tsx
✅ Landing.tsx  
✅ Index.tsx

# Components to audit (may need updates):
- HeroUploadSection.tsx
- FamilySelector.tsx
- ExpenseForm.tsx
- All auth-demo components
- Dashboard pages
```

**Decision criteria**: Should this component show different UI to authenticated vs unauthenticated users in the actual app? If yes, it should use `useAuthPreview()` instead of `useAuth()` directly.

### Medium Priority: Better UX for Recording Workflow

**Option A: Auto-open preview tab**
- When admin clicks "Record GIF", automatically open target page with `?_preview_auth=false` in new tab
- Provide "Copy link" button to paste into Screen Capture API picker

**Option B: Preview URL helper**
- Show preview URL with copy button in GifRecordingPanel
- Example: `https://preview--nuacha.lovable.app/?_preview_auth=false`

**Option C: In-app browser (iframe) with warning**
- Keep iframe for visual reference
- Add clear warning: "This is a reference view. Screen Capture will record the actual tab you select."

### Low Priority: Documentation

- Add memory documenting this pattern
- Create developer guide explaining when to use `useAuthPreview()` vs `useAuth()`
- Document the Screen Capture API limitation vs iframe-based capture

## Design Patterns to Follow

### Component Pattern: Using Auth Preview

```tsx
// ❌ Wrong: Directly using useAuth (ignores preview mode)
const { user } = useAuth();

// ✅ Correct: Using useAuthPreview (respects preview mode)
const { user, isPreviewMode, isActuallyAuthenticated } = useAuthPreview();
```

### Admin Route Protection Pattern

```tsx
// In AuthPreviewContext.tsx
const ADMIN_ROUTES = ['/updates'];
const ADMIN_PARAMS = ['tab=admin'];

const isAdminContext = useMemo(() => {
  const isAdminRoute = ADMIN_ROUTES.some(route => location.pathname.startsWith(route));
  const hasAdminParam = ADMIN_PARAMS.some(param => location.search.includes(param));
  return isAdminRoute && hasAdminParam;
}, [location.pathname, location.search]);

// Preview mode disabled for admin contexts
const isPreviewMode = previewModeRequested && !isAdminContext;
```

### Recording Workflow Pattern

1. Admin navigates to `/updates?tab=admin` (authenticated, admin context)
2. Admin clicks "Record GIF" for step requiring unauthenticated UI
3. System shows instructions: "Open target page with ?_preview_auth=false in separate tab"
4. Admin opens e.g., `/?_preview_auth=false` in new tab
5. Components using `useAuthPreview()` show unauthenticated UI
6. Admin starts Screen Capture recording
7. Browser prompts for screen/tab selection
8. Admin selects the tab with `?_preview_auth=false`
9. Recording captures actual unauthenticated UI
10. Admin stops recording, previews video, saves GIF

## Future Enhancements

1. **Browser Extension Approach**: Chrome extension that could inject preview mode into any tab without URL parameter
2. **Separate Preview Environment**: Deploy separate preview build that's always unauthenticated
3. **Server-Side Rendering for Screenshots**: Backend service generates screenshots in controlled environment
4. **Video Editing Post-Processing**: Record authenticated flow, manually edit out auth-specific UI elements

## Status

- ✅ `AuthPreviewContext` infrastructure complete
- ✅ Admin route protection implemented
- ✅ Navbar, Landing, Index updated to use `useAuthPreview()`
- ⏳ Audit remaining auth-aware components (in progress)
- ⏳ Improve recording workflow UX (planned)
- ⏳ Complete documentation (planned)

## Testing Checklist

- [ ] Admin at `/updates?tab=admin` can access recording tools while authenticated
- [ ] Opening `/?_preview_auth=false` in separate tab shows unauthenticated landing UI
- [ ] Navbar shows "Sign in" instead of "Sign out" when preview mode active
- [ ] HeroUploadSection shows upload CTAs instead of "Welcome back" when preview mode active
- [ ] Screen Capture API successfully records the preview tab showing unauthenticated UI
- [ ] Recorded video accurately represents what real unauthenticated users see

## Known Limitations

1. **Manual workflow**: Admin must manually open preview tab - no automation yet
2. **Component coverage**: Not all components respect preview mode yet
3. **No visual indicator**: Preview tabs don't have clear "PREVIEW MODE ACTIVE" banner
4. **Browser permission**: Screen Capture API requires permission grant every time
5. **Tab selection friction**: Admin must remember which tab has preview mode enabled

---

**Last Updated**: 2025-11-27
**Author**: Lovable AI (via user request)
**Status**: Documented, Partially Implemented
