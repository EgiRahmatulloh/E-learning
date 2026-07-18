import DOMPurify from "dompurify";

/**
 * Client-side HTML sanitizer as defense-in-depth.
 * Server already sanitizes on write (sanitize-html), this is a safety net for render.
 */
export const safeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ["font", "u", "span"],
    ADD_ATTR: ["style", "class", "size", "color", "face"],
  });
};
