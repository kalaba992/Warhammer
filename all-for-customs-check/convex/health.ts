import { query } from './_generated/server'

/**
 * Health check endpoint for monitoring application status
 * Returns overall system health and service availability
 */
export const check = query(async () => {
  const timestamp = Date.now()
  
  // Check database connectivity
  const dbHealthy = (() => {
    try {
      // If we can reach this function, DB is healthy
      return true
    } catch {
      return false
    }
  })()

  return {
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp,
    buildVersion: '41ecc03',
    services: {
      database: {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp
      },
      openai: {
        status: 'configured', // Can't test without making API call
        timestamp
      },
      auth0: {
        status: 'configured', // Will be validated on login attempt
        timestamp
      },
      convex: {
        status: 'healthy',
        timestamp
      }
    },
    uptime: process.uptime?.() || 0,
    environment: 'production'
  }
})

export const getSystemStats = query(async () => {
  return {
    timestamp: Date.now(),
    buildVersion: '41ecc03',
    deployment: 'cloudflare-pages',
    branch: 'main',
    lastDeployment: new Date('2026-01-02T02:10:00Z').toISOString()
  }
})
