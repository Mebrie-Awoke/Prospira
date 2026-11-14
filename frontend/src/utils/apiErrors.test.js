import { describe, expect, it } from 'vitest'
import { getApiError } from './apiErrors'

describe('getApiError', () => {
  it('does not expose server exception details', () => {
    expect(getApiError({
      response: {
        status: 500,
        data: { detail: 'Traceback: database password unavailable' },
      },
    })).toBe('Prospira is temporarily unavailable. Please try again in a few moments.')
  })

  it('explains duplicate email registration clearly', () => {
    expect(getApiError({
      response: {
        status: 400,
        data: { email: ['A user with this email already exists.'] },
      },
    })).toBe('Email address: An account with this email address already exists. Try signing in instead.')
  })

  it('provides a useful message when the API cannot be reached', () => {
    expect(getApiError({ code: 'ERR_NETWORK' })).toBe(
      'We could not connect to Prospira. Check your internet connection and try again.',
    )
  })

  it('handles rate limiting without showing server details', () => {
    expect(getApiError({
      response: { status: 429, data: { detail: 'Internal rate limit metadata' } },
    })).toBe('You have made too many requests. Please wait a moment before trying again.')
  })
})
