import assert from 'node:assert'

const requireEnv = (key: string) => {
  const value = process.env[key]
  assert(value, `Required env key "${key}" missing`)

  return value
}

export default {
  auth: {
    signingKey: requireEnv('AUTH_SIGNING_KEY'),
    tokenTTL: 1000 * 60 * 60 * 24 * 7,
  },

  database: {
    url: requireEnv('DATABASE_URL'),
  },
}
