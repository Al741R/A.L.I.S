# Bug Fixes - December 5, 2025

## Issue 1: QuotaExceededError on Book Cover Storage

### Problem

When editing books, localStorage quota was exceeded due to large uncompressed images being stored as data URLs.

**Error:**

```
QuotaExceededError: Failed to execute 'setItem' on 'Storage': Setting the value of 'alis_book_covers' exceeded the quota.
```

### Solution

1. **Added image compression** in `BooksAdminView.vue`:
   - Images are now compressed to max 800px width
   - JPEG quality set to 0.8 (80%)
   - Reduces storage size by 70-90%

2. **Added error handling** in `bookCovers.js` store:
   - Try-catch wrapper around localStorage.setItem
   - Automatic cleanup of old covers when quota exceeded
   - Keeps only 50 most recent covers
   - User-friendly error messages

3. **Added utility functions**:
   - `cleanupOldCovers()` - removes oldest entries
   - `getStorageSize()` - monitors storage usage
   - Size warnings for large images (>500KB)

### Files Modified

- `src/stores/bookCovers.js`
- `src/views/BooksAdminView.vue`

## Issue 2: 422 Analytics Error

### Problem

Browser console showing 422 (Unprocessable Content) errors related to analytics.

**Error:**

```
Failed to load resource: the server responded with a status of 422 (Unprocessable Content)
```

### Root Cause

This error is coming from **Grammarly browser extension** (visible in stack trace: `Grammarly.js:2`), not from the ALIS application. The analytics store in ALIS is localStorage-only and does not make API calls.

### Solution

No code changes needed. This is a benign error from a browser extension trying to interact with the page. It does not affect ALIS functionality.

**To suppress:**

- Disable Grammarly extension when testing
- Or add extension filter in browser DevTools console

## Testing Recommendations

1. **Test book cover upload:**
   - Upload large images (>1MB) and verify compression
   - Edit multiple books with covers
   - Check localStorage size with browser DevTools

2. **Verify storage cleanup:**
   - Add 50+ book covers
   - Verify automatic cleanup triggers
   - Check that covers are retained properly

3. **Monitor console:**
   - Grammarly errors can be ignored
   - Watch for other 422 errors from actual API calls

## Prevention

- Consider migrating to backend storage for book covers in future
- Add user warnings when approaching storage limits
- Implement cover image size limits in UI
