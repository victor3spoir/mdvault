/**
 * Content sanitization utilities for preventing XSS attacks
 */

/**
 * Sanitize user input text - remove all HTML tags and scripts
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Remove all HTML tags
  let sanitized = text.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove script-like patterns
  sanitized = sanitized
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/eval\(/gi, "");

  return sanitized.trim();
}

/**
 * Validate URL is safe (not javascript: or data: URI)
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sanitize markdown content - prevent dangerous patterns
 */
export function sanitizeMarkdown(content: string): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  let sanitized = content;

  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove data attributes with javascript
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, "");

  // Remove style tags with expressions
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*javascript[^"']*["']/gi, "");

  return sanitized;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  const sanitized = email.toLowerCase().trim();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return "";
  }

  return sanitized;
}

/**
 * Sanitize tag values
 */
export function sanitizeTag(tag: string): string {
  if (!tag || typeof tag !== "string") {
    return "";
  }

  // Remove HTML, trim, lowercase
  let sanitized = tag
    .replace(/<[^>]*>/g, "")
    .trim()
    .toLowerCase();

  // Remove special characters except hyphens and underscores
  sanitized = sanitized.replace(/[^a-z0-9\-_]/g, "");

  // Limit length
  return sanitized.substring(0, 50);
}

/**
 * Sanitize array of tags
 */
export function sanitizeTags(tags: unknown[]): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
    .map(sanitizeTag)
    .filter((tag) => tag.length > 0);
}
