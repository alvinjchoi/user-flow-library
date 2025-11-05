import { AIService } from '../ai-services'

// Mock fetch
global.fetch = jest.fn()

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('analyzeScreenshot', () => {
    it('should successfully analyze screenshot', async () => {
      const mockResponse = {
        title: 'Login Screen',
        displayName: 'Signing in',
        description: 'User login page',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await AIService.analyzeScreenshot('http://example.com/image.png')
      
      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: 'http://example.com/image.png' }),
      })
    })

    it('should throw error on failed request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'AI service error' }),
      })

      await expect(
        AIService.analyzeScreenshot('http://example.com/image.png')
      ).rejects.toThrow('AI service error')
    })

    it('should handle fetch errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => { throw new Error('Parse error') },
      })

      await expect(
        AIService.analyzeScreenshot('http://example.com/image.png')
      ).rejects.toThrow()
    })
  })

  describe('detectElements', () => {
    it('should successfully detect elements', async () => {
      const mockResponse = {
        elements: [
          {
            boundingBox: { x: 10, y: 20, width: 30, height: 40 },
            elementType: 'button',
            label: 'Login',
          },
        ],
        count: 1,
        raw_count: 1,
        method: 'gpt4' as const,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await AIService.detectElements('screen-123')
      
      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/screens/screen-123/detect-elements', {
        method: 'POST',
      })
    })

    it('should throw error on failed request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Screen not found' }),
      })

      await expect(
        AIService.detectElements('screen-123')
      ).rejects.toThrow('Screen not found')
    })
  })

  describe('isAvailable', () => {
    it('should return true', () => {
      expect(AIService.isAvailable()).toBe(true)
    })
  })

  describe('getErrorMessage', () => {
    it('should return API key error message', () => {
      const error = new Error('API key is invalid')
      const message = AIService.getErrorMessage(error)
      expect(message).toContain('not configured')
    })

    it('should return rate limit error message', () => {
      const error = new Error('rate limit exceeded')
      const message = AIService.getErrorMessage(error)
      expect(message).toContain('temporarily unavailable')
    })

    it('should return timeout error message', () => {
      const error = new Error('Request timeout')
      const message = AIService.getErrorMessage(error)
      expect(message).toContain('timed out')
    })

    it('should return generic error message', () => {
      const error = new Error('Unknown error')
      const message = AIService.getErrorMessage(error)
      expect(message).toBe('Unknown error')
    })

    it('should handle non-Error objects', () => {
      const message = AIService.getErrorMessage('string error')
      expect(message).toContain('unexpected error')
    })
  })
})

