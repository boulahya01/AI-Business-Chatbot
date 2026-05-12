/**
 * Simple rate limiter using in-memory sliding window
 * For distributed production, use Supabase cache or Redis
 */

class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private limit: number
  private windowMs: number

  constructor(limit: number = 30, windowMs: number = 60 * 1000) {
    this.limit = limit
    this.windowMs = windowMs

    // Clean up old requests every minute
    setInterval(() => {
      const now = Date.now()
      for (const [key, times] of this.requests.entries()) {
        const active = times.filter((t) => now - t < this.windowMs)
        if (active.length === 0) {
          this.requests.delete(key)
        } else {
          this.requests.set(key, active)
        }
      }
    }, 60000)
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const times = this.requests.get(key) || []

    // Filter out old requests
    const recent = times.filter((t) => now - t < this.windowMs)

    if (recent.length >= this.limit) {
      return false
    }

    recent.push(now)
    this.requests.set(key, recent)
    return true
  }

  getRemainingRequests(key: string): number {
    const now = Date.now()
    const times = this.requests.get(key) || []
    const recent = times.filter((t) => now - t < this.windowMs)
    return Math.max(0, this.limit - recent.length)
  }
}

// Singleton instances with production-like limits
export const chatLimiter = new RateLimiter(20, 60 * 1000) // 20 requests/minute
export const ingestLimiter = new RateLimiter(10, 60 * 1000) // 10 uploads/minute

/**
 * Check rate limit for a user
 */
export async function checkRateLimit(
  userId: string,
  limiter: RateLimiter,
  type: 'chat' | 'ingest'
): Promise<{
  allowed: boolean
  remaining: number
  error?: string
}> {
  const key = `${type}:${userId}`

  if (!limiter.isAllowed(key)) {
    return {
      allowed: false,
      remaining: 0,
      error: `Rate limit exceeded. Max ${limiter['limit']} ${type} requests per minute`,
    }
  }

  return {
    allowed: true,
    remaining: limiter.getRemainingRequests(key),
  }
}
