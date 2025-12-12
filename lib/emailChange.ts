import crypto from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET || process.env.SECRET || ''
if (!SECRET) {
  // will throw on use if missing
}

type Payload = {
  userId: string
  newEmail: string
  exp: number
}

function base64url(input: string) {
  return Buffer.from(input).toString('base64url')
}

function unbase64url(input: string) {
  return Buffer.from(input, 'base64url').toString()
}

export function signEmailChangeToken(userId: string, newEmail: string, expiresInSeconds = 60 * 60 * 24) {
  if (!SECRET) throw new Error('Missing NEXTAUTH_SECRET for signing tokens')
  const payload: Payload = { userId, newEmail, exp: Math.floor(Date.now() / 1000) + expiresInSeconds }
  const payloadStr = JSON.stringify(payload)
  const payloadB64 = base64url(payloadStr)
  const sig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('hex')
  return `${payloadB64}.${sig}`
}

export function verifyEmailChangeToken(token: string): Payload | null {
  if (!SECRET) throw new Error('Missing NEXTAUTH_SECRET for signing tokens')
  try {
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return null
    const expected = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null
    const payloadStr = unbase64url(payloadB64)
    const payload = JSON.parse(payloadStr) as Payload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch (err) {
    return null
  }
}
