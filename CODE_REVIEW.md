# MDVault Code Review

## Executive Summary
**Overall Score: 7.5/10**

MDVault is a well-architected CMS with modern UI/UX and solid foundational security. The design is clean and contemporary with good accessibility patterns. However, there are critical security gaps around file uploads, input validation, and authentication that must be addressed before production deployment.

---

## 📊 UI/UX Design Review

### Design Rating: **8/10** ✅

#### Strengths
1. **Modern Aesthetic** ✨
   - Clean, minimalist design with proper use of Tailwind CSS v4
   - Smooth animations and transitions (fade-in, slide-in effects)
   - Gradient accents and backdrop-blur effects create premium feel
   - Responsive grid layouts work well across mobile/desktop

2. **Typography & Spacing** 📝
   - Consistent font hierarchy (h1 → h6, body, captions)
   - Proper line-height and letter-spacing
   - Good use of whitespace prevents visual clutter
   - Clear visual hierarchy guides user attention

3. **Component Library** 🎨
   - Well-organized shadcn/ui components
   - Consistent button states (default, hover, active, disabled)
   - Color palette is cohesive and accessible
   - Logo design is memorable (vault + markdown symbol)

4. **Sidebar Navigation** 🧭
   - Collapsible sidebar is intuitive
   - Clear icon+text labels for each section
   - Good use of hover states and active indicators
   - Breadcrumb navigation on pages

5. **Landing Page** 🚀
   - Hero section is engaging with animated elements
   - Clear CTA buttons (primary + secondary)
   - Feature grid communicates value clearly
   - Good visual hierarchy

#### Areas for Improvement

1. **Missing Loading States** ⚠️
   - Post save/publish buttons show "Saving..." but unclear visual feedback
   - Image upload shows spinner but could be more prominent
   - Consider skeleton loaders for content sections

   **Suggestion:** Add shimmer loading skeletons for post lists and async operations

2. **Error Handling UX** ❌
   - Errors are logged to console but no user-facing toasts
   - Network failures silently fail (deletePostAction, etc.)
   - No feedback on file upload failures

   **Suggestion:**
   ```tsx
   // Add a toast notification system (e.g., sonner or react-hot-toast)
   import { toast } from "sonner";
   
   try {
     await deletePostAction(slug)
     toast.success("Post deleted successfully")
   } catch (error) {
     toast.error("Failed to delete post")
   }
   ```

3. **Empty States** 📭
   - Posts list with no posts shows nothing
   - Media gallery with no images shows empty
   - No guidance on what to do next

   **Suggestion:** Add empty state components with call-to-action buttons

4. **Code Block Display** 💻
   - Code blocks in preview render but could use line numbers
   - Copy button for code blocks would be helpful
   - Syntax highlighting colors could be more vibrant

   **Suggestion:** Add `react-syntax-highlighter` or similar with copy-to-clipboard feature

5. **Accessibility Gaps** ♿
   - Missing ARIA labels on some icons
   - Focus ring not always visible on keyboard navigation
   - Form validation errors not announced to screen readers

   **Suggestion:**
   ```tsx
   // Example fix
   <button aria-label="Delete post" onClick={handleDelete}>
     <IconTrash />
   </button>
   ```

6. **Mobile Responsiveness** 📱
   - Editor toolbar may wrap awkwardly on small screens
   - Input fields could use larger touch targets (current: ~32px, target: 44px)

---

## 🔒 Security Review

### Security Rating: **5.5/10** ⚠️ CRITICAL ISSUES

### 🔴 CRITICAL Issues

#### 1. **No File Upload Validation** 🚨
**Severity: CRITICAL**

Current code:
```typescript
// medias.actions.ts
const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
const imageFiles = files.filter((f) =>
  imageExtensions.some((ext) => f.name.toLowerCase().endsWith(ext)),
);
```

Problems:
- ✗ Extension-based validation only (easily spoofed by renaming `.exe` → `.jpg`)
- ✗ No MIME type verification
- ✗ No file size limits enforced on server
- ✗ SVG files are allowed (XSS vulnerability if user-controlled)
- ✗ No virus/malware scanning

**Fix:**
```typescript
import { fromBuffer } from "file-type";
import { lookup } from "mime-types";

export async function uploadImageAction(file: File): Promise<UploadedImage> {
  // 1. Validate MIME type
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedMimes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.");
  }

  // 2. Check file size on server (5MB limit)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds 5MB limit");
  }

  // 3. Verify file magic bytes (true file type)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ft = await fromBuffer(buffer);
  if (!ft || !allowedMimes.includes(ft.mime)) {
    throw new Error("File is not a valid image");
  }

  // 4. Rename file to UUID to prevent overwrite attacks
  const fileExtension = `.${ft.ext}`;
  const imageId = uuidv4();
  const fileName = `${imageId}${fileExtension}`;

  // ... rest of upload logic
}
```

#### 2. **No Authentication/Authorization** 🔐
**Severity: CRITICAL**

Current state:
- ✗ No user authentication required
- ✗ Anyone with access to the deployment can modify/delete all posts
- ✗ No rate limiting on API calls
- ✗ GitHub token is shared across all users

**Fix - Add Authentication Layer:**
```typescript
// lib/auth.ts
import { headers } from "next/headers";

export async function authenticate() {
  const headersList = await headers();
  const token = headersList.get("x-api-key");

  if (!token) {
    throw new Error("Unauthorized");
  }

  // Verify token (e.g., from Auth0, Clerk, NextAuth.js)
  const user = await verifyToken(token);
  return user;
}

// features/posts/posts.actions.ts
export async function deletePostAction(slug: string) {
  const user = await authenticate(); // Add auth check
  
  // ... delete logic
}
```

**Recommendation:** Use one of:
- [NextAuth.js](https://next-auth.js.org/) (recommended for GitHub OAuth)
- [Clerk](https://clerk.com/) (modern alternative)
- [Auth0](https://auth0.com/)

#### 3. **No Input Validation/Sanitization** 📝
**Severity: HIGH**

Current code accepts user input directly:
```typescript
export async function createPostAction(input: CreatePostInput) {
  // No validation on:
  // - title (could be 100,000 characters)
  // - slug (could contain path traversal: "../../../etc/passwd")
  // - description
  // - tags (no limit on count)
  // - content (no XSS prevention)
}
```

**Fix:**
```typescript
import { z } from "zod";

const CreatePostSchema = z.object({
  title: z.string()
    .min(1, "Title required")
    .max(200, "Title too long")
    .trim(),
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, "Invalid slug format")
    .max(100),
  description: z.string()
    .max(500, "Description too long")
    .trim(),
  tags: z.array(z.string().max(50)).max(10, "Max 10 tags"),
  content: z.string()
    .max(1000000, "Content too large (1MB max)"),
  coverImage: z.string().url().optional(),
  published: z.boolean().optional(),
});

export async function createPostAction(input: unknown) {
  const validatedInput = CreatePostSchema.parse(input);
  // Now safely use validatedInput
}
```

#### 4. **GitHub Token Exposure Risk** 🔑
**Severity: HIGH**

Current issues:
- ✗ Token in environment variables (fine) but used in `lib/octokit.ts`
- ✗ Token visible in Octokit error messages (debugging)
- ✗ No token rotation strategy
- ✗ Token has access to entire repo (should use personal access tokens with repo scope only)

**Fix:**
```typescript
// lib/octokit.ts
const { GITHUB_TOKEN } = getenv();

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  log: {
    // Don't log sensitive data
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: console.error, // Only errors, no token logging
  },
});

// Add this check
if (process.env.NODE_ENV === "production" && !GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is required in production");
}
```

---

### 🟡 HIGH Priority Issues

#### 5. **Server Action Size Limit Not Enforced on Input** 
**Severity: HIGH**

The `next.config.ts` sets `bodySizeLimit: "2mb"`, but a user can craft a 2MB markdown post that could cause memory issues.

**Fix:**
```typescript
// features/posts/posts.actions.ts
export async function updatePostAction(input: UpdatePostInput) {
  if (input.content.length > 500000) { // 500KB limit
    throw new Error("Content exceeds 500KB");
  }
  // Continue update
}
```

#### 6. **No Error Boundary in Editor** 🚫
**Severity: MEDIUM-HIGH**

If MDXEditor crashes, the entire page fails with no recovery mechanism.

**Fix:**
```tsx
// features/posts/components/post-editor-wrapper.tsx
'use client'

import { ErrorBoundary } from 'react-error-boundary'

export function PostEditorWrapper() {
  return (
    <ErrorBoundary 
      fallback={<div>Editor failed to load</div>}
      onError={(error) => console.error("Editor error:", error)}
    >
      <PostEditor mode="create" />
    </ErrorBoundary>
  )
}
```

---

### 🟡 MEDIUM Priority Issues

#### 7. **No Content Security Policy (CSP)** 
**Severity: MEDIUM**

Without CSP, XSS attacks could execute arbitrary JavaScript.

**Fix - Add to `next.config.ts`:**
```typescript
const nextConfig: NextConfig = {
  // ... existing config
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline';",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};
```

#### 8. **No Rate Limiting** 
**Severity: MEDIUM**

A malicious actor could:
- Upload 1000 images → GitHub account quota exceeded
- Spam create/delete post operations
- Brute force any endpoints

**Fix:**
```typescript
// lib/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 requests per hour
});

export async function checkRateLimit(userId: string) {
  const { success } = await ratelimit.limit(userId);
  if (!success) {
    throw new Error("Rate limit exceeded");
  }
}

// Usage in actions
export async function uploadImageAction(file: File) {
  const user = await authenticate();
  await checkRateLimit(user.id);
  // Continue upload...
}
```

#### 9. **Incomplete Error Handling in Post Actions** 
**Severity: MEDIUM**

Many try-catch blocks log errors but don't provide user feedback.

#### 10. **No Logging/Audit Trail** 
**Severity: MEDIUM**

No record of who did what and when (important for CMS systems).

**Fix:**
```typescript
// lib/logger.ts
export async function logAction(action: string, details: any) {
  await octokit.repos.createOrUpdateFileContents({
    owner: githubRepoInfo.owner,
    repo: githubRepoInfo.repo,
    path: `logs/${new Date().toISOString()}.json`,
    message: `Log: ${action}`,
    content: Buffer.from(JSON.stringify({ action, details, timestamp: new Date() })).toString("base64"),
  });
}
```

---

### 🟢 LOW Priority Issues

#### 11. **Missing Environment Validation** 
Add validation for all required env vars:
```typescript
// lib/env.ts - Already good, but add this check
export function validateEnv() {
  const required = ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"];
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}

// Call in next.config.ts or app initialization
validateEnv();
```

#### 12. **No HTTPS Enforcement** 
For production:
```typescript
// next.config.ts
headers: async () => {
  return [
    {
      source: "/:path*",
      headers: [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ],
    },
  ];
};
```

---

## 📋 Security Checklist

- [ ] **CRITICAL:** Implement file upload validation (magic bytes, MIME type, size)
- [ ] **CRITICAL:** Add authentication layer (NextAuth.js recommended)
- [ ] **CRITICAL:** Add input validation with Zod or similar
- [ ] **HIGH:** Implement rate limiting
- [ ] **HIGH:** Add error boundaries to React components
- [ ] **HIGH:** Add Content Security Policy headers
- [ ] **MEDIUM:** Add error toast notifications
- [ ] **MEDIUM:** Add audit logging
- [ ] **MEDIUM:** Remove SVG from allowed file types (unless sanitized)
- [ ] **MEDIUM:** Add GitHub token rotation strategy
- [ ] **LOW:** Add HTTPS enforcement
- [ ] **LOW:** Add environment variable validation

---

## 🎨 UX Improvement Checklist

- [ ] Add toast notifications for success/error feedback
- [ ] Add empty state components for all lists
- [ ] Add loading skeletons for async operations
- [ ] Add keyboard shortcuts (e.g., Cmd+S to save)
- [ ] Add copy button to code blocks
- [ ] Add line numbers to code blocks
- [ ] Improve mobile responsiveness of editor toolbar
- [ ] Add confirmation dialogs for destructive actions (already done ✅)
- [ ] Add breadcrumb navigation (already done ✅)
- [ ] Add accessibility improvements (ARIA labels, focus management)

---

## 🚀 Recommended Implementation Order

1. **Week 1 (Critical)**
   - Implement authentication with NextAuth.js
   - Add input validation with Zod
   - Fix file upload validation

2. **Week 2 (High)**
   - Add rate limiting
   - Add error boundaries
   - Add CSP headers

3. **Week 3 (Medium)**
   - Add toast notifications
   - Add audit logging
   - Add empty states

4. **Week 4 (Polish)**
   - Accessibility improvements
   - Performance optimization
   - Code block enhancements

---

## 📚 Resources

- [OWASP Top 10 2023](https://owasp.org/Top10/)
- [Next.js Security Best Practices](https://nextjs.org/docs/security)
- [Zod Validation Library](https://zod.dev/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [GitHub REST API Rate Limits](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api)

---

**Last Updated:** December 20, 2025
**Reviewer:** Code Audit System
