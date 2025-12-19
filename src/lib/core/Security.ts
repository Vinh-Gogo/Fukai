// Security utilities and middleware for the application
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Rate limiting interface
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

// Rate limiter class
class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  // Check if request is allowed
  isAllowed(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
        lastAccess: now
      };
      this.store.set(identifier, newEntry);
      
      return {
        allowed: true,
        resetTime: newEntry.resetTime,
        remaining: this.maxRequests - 1
      };
    }

    // Update existing entry
    entry.count++;
    entry.lastAccess = now;

    if (entry.count > this.maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: this.maxRequests - entry.count
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Input sanitization utilities
export class InputSanitizer {
  // Sanitize string input
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim and limit length
    sanitized = sanitized.trim().substring(0, maxLength);
    
    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized;
  }

  // Sanitize URL
  static sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      
      // Remove fragment and some query parameters for security
      parsed.hash = '';
      
      return parsed.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  // Sanitize email
  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email.toLowerCase(), 254);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }

  // Sanitize filename
  static sanitizeFilename(filename: string): string {
    const sanitized = this.sanitizeString(filename, 255);
    
    // Remove path traversal characters and other dangerous chars
    return sanitized
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\.\./g, '')
      .replace(/^\./, '');
  }

  // Validate and sanitize JSON input
  static sanitizeJSON(input: string): unknown {
    try {
      const parsed = JSON.parse(input);
      this.validateObject(parsed);
      return parsed;
    } catch {
      throw new Error('Invalid JSON format');
    }
  }

  // Recursively validate object structure
  private static validateObject(obj: unknown, depth: number = 0): void {
    if (depth > 10) {
      throw new Error('Object nesting too deep');
    }

    if (obj === null || typeof obj !== 'object') {
      return;
    }

    for (const key in obj) {
      // Validate key names
      if (typeof key !== 'string' || key.length > 100) {
        throw new Error('Invalid object key');
      }

      const value = (obj as Record<string, unknown>)[key];
      
      // Check for prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new Error('Prototype pollution detected');
      }

      if (typeof value === 'object' && value !== null) {
        this.validateObject(value, depth + 1);
      }
    }
  }
}

// CSRF protection utilities
export class CSRFProtection {
  // Generate CSRF token
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate CSRF token
  static validateToken(token: string, sessionToken: string): boolean {
    return !!(token && sessionToken && token === sessionToken);
  }

  // Set CSRF cookie
  static setCSRFCookie(res: NextResponse, token: string): void {
    res.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });
  }

  // Get CSRF token from cookie
  static getCSRFToken(request: NextRequest): string | undefined {
    return request.cookies.get('csrf-token')?.value;
  }
}

// Content Security Policy utilities
export class CSPUtils {
  // Generate CSP header
  static generateCSP(options: {
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    mediaSrc?: string[];
  } = {}): string {
    const directives: string[] = [];

    // Default sources
    const defaultSrc = ["'self'"];
    
    directives.push(`default-src ${defaultSrc.join(' ')}`);
    
    if (options.scriptSrc) {
      directives.push(`script-src ${[...defaultSrc, ...options.scriptSrc].join(' ')}`);
    }
    
    if (options.styleSrc) {
      directives.push(`style-src ${[...defaultSrc, ...options.styleSrc].join(' ')}`);
    }
    
    if (options.imgSrc) {
      directives.push(`img-src ${[...defaultSrc, ...options.imgSrc].join(' ')}`);
    }
    
    if (options.connectSrc) {
      directives.push(`connect-src ${[...defaultSrc, ...options.connectSrc].join(' ')}`);
    }
    
    if (options.fontSrc) {
      directives.push(`font-src ${[...defaultSrc, ...options.fontSrc].join(' ')}`);
    }
    
    if (options.mediaSrc) {
      directives.push(`media-src ${[...defaultSrc, ...options.mediaSrc].join(' ')}`);
    }

    return directives.join('; ');
  }

  // Apply CSP to response
  static applyCSP(res: NextResponse, csp: string): void {
    res.headers.set('Content-Security-Policy', csp);
  }
}

// Security headers utilities
export class SecurityHeaders {
  // Add security headers to response
  static addSecurityHeaders(res: NextResponse): void {
    // Prevent clickjacking
    res.headers.set('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.headers.set('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // HSTS (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Permissions policy
    res.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );
  }
}

// File upload security
export class FileUploadSecurity {
  // Allowed file types
  private static readonly ALLOWED_TYPES = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json'
  ];

  // Maximum file size (50MB)
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024;

  // Validate uploaded file
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size exceeds maximum limit of 50MB'
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed'
      };
    }

    // Check file name for suspicious patterns
    const sanitizedName = InputSanitizer.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      return {
        valid: false,
        error: 'File name contains invalid characters'
      };
    }

    return { valid: true };
  }

  // Scan file content for malicious patterns
  static async scanFile(file: File): Promise<{ safe: boolean; threats?: string[] }> {
    const threats: string[] = [];
    
    try {
      const buffer = await file.arrayBuffer();
      const view = new Uint8Array(buffer);
      
      // Check for common malicious patterns
      const patterns = [
        new Uint8Array([0x4D, 0x5A]), // PE executable
        new Uint8Array([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
        new Uint8Array([0xCA, 0xFE, 0xBA, 0xBE]), // Java class
        new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // ZIP (could contain executables)
      ];

      for (const pattern of patterns) {
        if (this.matchesPattern(view, pattern)) {
          threats.push('Executable content detected');
          break;
        }
      }

      // Check for script content in non-script files
      if (file.type !== 'application/json' && file.type !== 'text/plain') {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(view.slice(0, 1024));
        if (text.includes('<script') || text.includes('javascript:')) {
          threats.push('Script content detected');
        }
      }

    } catch {
      threats.push('File scan failed');
    }

    return {
      safe: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined
    };
  }

  // Check if bytes match pattern
  private static matchesPattern(data: Uint8Array, pattern: Uint8Array): boolean {
    if (data.length < pattern.length) return false;
    
    for (let i = 0; i < pattern.length; i++) {
      if (data[i] !== pattern[i]) return false;
    }
    
    return true;
  }
}

// Rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limiter
  api: new RateLimiter(60000, 100), // 100 requests per minute
  
  // Upload rate limiter
  upload: new RateLimiter(60000, 10), // 10 uploads per minute
  
  // Auth rate limiter
  auth: new RateLimiter(900000, 5), // 5 attempts per 15 minutes
  
  // Crawl rate limiter
  crawl: new RateLimiter(3600000, 20), // 20 crawls per hour
};

// Cleanup expired rate limit entries periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
  }, 60000); // Clean up every minute
}

const securityUtils = {
  InputSanitizer,
  CSRFProtection,
  CSPUtils,
  SecurityHeaders,
  FileUploadSecurity,
  rateLimiters
};

export default securityUtils;
