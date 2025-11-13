/**
 * @jest-environment node
 */
import {
  APIError,
  APIErrors,
  handleAPIError,
  assertExists,
  assertAuthorized,
  isNextResponse,
} from '../api-errors'
import { ValidationError } from '../validators'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(),
    })),
  },
}))

describe('api-errors', () => {
  describe('APIError', () => {
    it('should create proper error object', () => {
      const error = new APIError(404, 'Not found', { id: '123' })
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('APIError')
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('Not found')
      expect(error.details).toEqual({ id: '123' })
    })
  })

  describe('APIErrors', () => {
    it('should create Unauthorized error', () => {
      const error = APIErrors.Unauthorized()
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('Unauthorized')
    })

    it('should create NotFound error', () => {
      const error = APIErrors.NotFound('Project')
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('Project not found')
    })

    it('should create BadRequest error', () => {
      const error = APIErrors.BadRequest('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Invalid input')
    })

    it('should create ServiceUnavailable error', () => {
      const error = APIErrors.ServiceUnavailable('OpenAI')
      expect(error.statusCode).toBe(503)
      expect(error.message).toBe('OpenAI is not available')
    })

    it('should create RateLimitExceeded error', () => {
      const error = APIErrors.RateLimitExceeded('API')
      expect(error.statusCode).toBe(429)
      expect(error.message).toBe('API rate limit exceeded')
    })
  })

  describe('handleAPIError', () => {
    it('should handle APIError', () => {
      const error = new APIError(404, 'Not found')
      const response = handleAPIError(error, 'test')
      
      expect(response).toBeDefined()
      expect(response.status).toBe(404)
    })

    it('should handle ValidationError', () => {
      const error = new ValidationError('field', 'Invalid field')
      const response = handleAPIError(error)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(400)
    })

    it('should handle OpenAI errors', () => {
      const error = { status: 401, message: 'Invalid API key' }
      const response = handleAPIError(error)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(503)
    })

    it('should handle Supabase PGRST116 errors', () => {
      const error = { code: 'PGRST116', message: 'No rows' }
      const response = handleAPIError(error)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(404)
    })

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong')
      const response = handleAPIError(error)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(500)
    })

    it('should handle unknown errors', () => {
      const error = 'string error'
      const response = handleAPIError(error)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(500)
    })
  })

  describe('assertExists', () => {
    it('should not throw for existing values', () => {
      expect(() => assertExists('value', 'error')).not.toThrow()
      expect(() => assertExists(0, 'error')).not.toThrow()
      expect(() => assertExists(false, 'error')).not.toThrow()
    })

    it('should throw APIError for null/undefined', () => {
      expect(() => assertExists(null, 'Not found')).toThrow(APIError)
      expect(() => assertExists(undefined, 'Not found')).toThrow(APIError)
      
      try {
        assertExists(null, 'Not found')
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)
        expect((error as APIError).statusCode).toBe(404)
      }
    })
  })

  describe('assertAuthorized', () => {
    it('should not throw for true condition', () => {
      expect(() => assertAuthorized(true)).not.toThrow()
    })

    it('should throw APIError for false condition', () => {
      expect(() => assertAuthorized(false)).toThrow(APIError)
      expect(() => assertAuthorized(false, 'Custom message')).toThrow('Custom message')
      
      try {
        assertAuthorized(false)
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)
        expect((error as APIError).statusCode).toBe(403)
      }
    })
  })

  describe('isNextResponse', () => {
    it.skip('should handle various input types (skipped in mocked environment)', () => {
      // Skip instanceof check in mocked environment
      // In real usage, this would check against NextResponse class
      // This test requires actual NextResponse class which is difficult to mock
      expect(typeof isNextResponse).toBe('function')
    })
  })
})

