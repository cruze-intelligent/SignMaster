/**
 * Security Utilities
 * 
 * Provides input sanitization and validation functions
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(str) {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Sanitize user input for storage
 */
export function sanitizeInput(input, maxLength = 100) {
  if (typeof input !== 'string') return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate player name
 */
export function validatePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  const sanitized = sanitizeInput(name, 50);
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (sanitized.length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }
  
  // Only allow letters, numbers, spaces, and basic punctuation
  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(sanitized)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true, sanitized };
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return '';
  
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Only allow alphanumeric, underscore, hyphen, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  
  return sanitized;
}

/**
 * Validate and sanitize XP value
 */
export function sanitizeXP(xp) {
  const num = parseInt(xp, 10);
  
  if (isNaN(num) || num < 0) return 0;
  if (num > 1000000) return 1000000; // Max XP cap
  
  return num;
}

/**
 * Validate IndexedDB key
 */
export function validateStorageKey(key) {
  if (!key || typeof key !== 'string') return false;
  
  // Key should only contain safe characters
  return /^[a-zA-Z0-9_\-:]+$/.test(key);
}

/**
 * Rate limiter for preventing abuse
 */
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = new Map();
  }

  /**
   * Check if action is allowed
   */
  isAllowed(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside time window
    const validRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Clear rate limit for a key
   */
  clear(key) {
    this.requests.delete(key);
  }
}

/**
 * Secure random ID generator
 */
export function generateSecureId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate URL to prevent open redirects
 */
export function validateURL(url) {
  try {
    const parsed = new URL(url);
    
    // Only allow https protocol for external links
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    
    // Whitelist allowed domains
    const allowedDomains = [
      'localhost',
      'github.io'
    ];
    
    const isAllowed = allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
    
    return isAllowed;
  } catch (e) {
    return false;
  }
}

/**
 * Sanitize certificate data
 */
export function sanitizeCertificateData(data) {
  return {
    playerName: sanitizeInput(data.playerName, 50),
    xp: sanitizeXP(data.xp),
    badges: Array.isArray(data.badges) ? data.badges.slice(0, 100) : [],
    stats: {
      total: parseInt(data.stats?.total || 0, 10),
      points: parseInt(data.stats?.points || 0, 10),
      rank: sanitizeInput(data.stats?.rank?.name || 'Beginner', 30)
    }
  };
}

export default {
  sanitizeHTML,
  sanitizeInput,
  validatePlayerName,
  sanitizeFilename,
  sanitizeXP,
  validateStorageKey,
  RateLimiter,
  generateSecureId,
  validateURL,
  sanitizeCertificateData
};
