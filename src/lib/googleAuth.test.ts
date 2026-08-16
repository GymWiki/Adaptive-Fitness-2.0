import { describe, expect, it } from 'vitest'
import { decodeGoogleIdToken } from './googleAuth'

function fakeCredential(claims: Record<string, unknown>): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${base64url({ alg: 'RS256' })}.${base64url(claims)}.fake-signature`
}

describe('decodeGoogleIdToken', () => {
  it('decodes a well-formed credential into the identity fields the app needs', () => {
    const credential = fakeCredential({
      sub: '1234567890',
      email: 'user@example.com',
      name: 'Jane Doe',
      picture: 'https://example.com/pic.jpg',
    })
    expect(decodeGoogleIdToken(credential)).toEqual({
      id: '1234567890',
      email: 'user@example.com',
      name: 'Jane Doe',
      picture: 'https://example.com/pic.jpg',
    })
  })

  it('defaults missing optional fields to null', () => {
    const credential = fakeCredential({ sub: '123', email: 'user@example.com' })
    expect(decodeGoogleIdToken(credential)).toEqual({
      id: '123',
      email: 'user@example.com',
      name: null,
      picture: null,
    })
  })

  it('returns null when required claims (sub/email) are missing', () => {
    expect(decodeGoogleIdToken(fakeCredential({ name: 'No Sub Or Email' }))).toBeNull()
  })

  it('returns null instead of throwing on malformed input', () => {
    expect(decodeGoogleIdToken('not-a-jwt')).toBeNull()
    expect(decodeGoogleIdToken('')).toBeNull()
    expect(decodeGoogleIdToken('a.b.c')).toBeNull()
    expect(decodeGoogleIdToken('a.not-valid-base64!!!.c')).toBeNull()
  })
})
