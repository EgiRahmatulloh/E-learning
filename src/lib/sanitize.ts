import DOMPurify from "dompurify";

/**
 * Client-side HTML sanitizer as defense-in-depth.
 * Server already sanitizes on write (sanitize-html), this is a safety net for render.
 */
export const safeHtml = (dirty: string | null | undefined): string => {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ["font", "u", "span"],
    ADD_ATTR: ["class", "size", "color", "face", "style", "align"],
  });
};
