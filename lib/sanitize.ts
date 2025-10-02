export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "")

  // Remove script-related patterns
  sanitized = sanitized.replace(/javascript:/gi, "")
  sanitized = sanitized.replace(/on\w+\s*=/gi, "")

  // Limit length to prevent DoS
  sanitized = sanitized.slice(0, 1000)

  return sanitized.trim()
}

/**
 * Escapes HTML special characters to prevent XSS
 * Use this when displaying user input in HTML
 */
export function sanitizeHtml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  }

  return str.replace(/[&<>"'/]/g, (char) => map[char] || char)
}
