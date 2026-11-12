/**
 * Security Middleware Suite:
 * 1. NoSQL Injection & Prototype Pollution Sanitizer
 * 2. Memory-bounded IP Rate Limiter (Auth & Global API)
 * 3. Safe URL Validator (blocks javascript:/data:/vbscript: XSS vectors)
 */

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function sanitizeObjectInPlace(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === "object" && obj[i] !== null) {
        sanitizeObjectInPlace(obj[i]);
      }
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    // Strip NoSQL operators ($gt, $ne, $where, etc.), dotted keys, and prototype pollution keys
    if (key.startsWith("$") || key.includes(".") || DANGEROUS_KEYS.has(key)) {
      delete obj[key];
      continue;
    }

    const val = obj[key];
    if (typeof val === "object" && val !== null) {
      sanitizeObjectInPlace(val);
    }
  }

  return obj;
}

/**
 * Middleware to sanitize req.body, req.params, and req.query against NoSQL injection
 */
export const sanitizeRequest = (req, _res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      sanitizeObjectInPlace(req.body);
    }
    if (req.params && typeof req.params === "object") {
      sanitizeObjectInPlace(req.params);
    }
    if (req.query && typeof req.query === "object") {
      sanitizeObjectInPlace(req.query);
    }
  } catch {
    // Continue safely if read-only property encountered
  }
  next();
};

/**
 * Lightweight, dependency-free IP Rate Limiter
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests from this IP, please try again later.",
} = {}) => {
  const hits = new Map();

  // Periodic cleanup to prevent memory growth
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, Math.min(windowMs, 60 * 1000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      hits.set(ip, record);
    }

    record.count += 1;

    const remaining = Math.max(0, max - record.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

/**
 * Escape special regex characters to prevent ReDoS (Regular Expression Denial of Service)
 */
export function escapeRegex(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validate external URLs to ensure only http:// or https:// protocols are permitted.
 * Blocks javascript:, data:, vbscript:, file: XSS vectors.
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return trimmed;
  } catch {
    return "";
  }
}
