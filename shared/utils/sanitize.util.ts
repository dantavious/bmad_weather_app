/**
 * Utility functions for input sanitization to prevent XSS attacks
 */

/**
 * Sanitizes HTML content by escaping dangerous characters
 * @param input The raw input string
 * @returns Sanitized string safe for display
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitizes search query input
 * - Removes HTML tags
 * - Trims whitespace
 * - Limits length to prevent DoS
 * @param query The search query
 * @param maxLength Maximum allowed length (default: 100)
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string, maxLength = 100): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove any HTML tags
  let sanitized = query.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous characters for search
  sanitized = sanitized.replace(/[<>'"`;()]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent abuse
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validates coordinate input to prevent injection
 * @param value The coordinate value
 * @returns true if valid coordinate
 */
export function isValidCoordinate(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num) && num >= -180 && num <= 180;
}

/**
 * Validates ZIP code format
 * @param zipCode The ZIP code to validate
 * @returns true if valid ZIP code format
 */
export function isValidZipCode(zipCode: string): boolean {
  // Support US (5 or 9 digits) and international postal codes
  const zipRegex = /^[A-Z0-9\s-]{3,10}$/i;
  return zipRegex.test(zipCode);
}