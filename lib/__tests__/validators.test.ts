import {
  validateBoundingBox,
  isValidBoundingBox,
  filterValidElements,
  validateNonEmptyString,
  validateUUID,
  validateImageFile,
  ValidationError,
} from '../validators'

describe('validators', () => {
  describe('validateBoundingBox', () => {
    it('should validate a correct bounding box', () => {
      const box = { x: 10, y: 20, width: 30, height: 40 }
      const result = validateBoundingBox(box)
      expect(result).toEqual(box)
    })

    it('should throw ValidationError for missing fields', () => {
      expect(() => validateBoundingBox({ x: 10, y: 20 } as any)).toThrow(
        ValidationError
      )
      expect(() => validateBoundingBox({ x: 10, y: 20 } as any)).toThrow(
        'Missing required bounding box fields'
      )
    })

    it('should throw ValidationError for out of range values', () => {
      expect(() => validateBoundingBox({ x: -1, y: 20, width: 30, height: 40 })).toThrow(
        ValidationError
      )
      expect(() => validateBoundingBox({ x: 101, y: 20, width: 30, height: 40 })).toThrow(
        'must be between 0 and 100'
      )
    })

    it('should throw ValidationError for box exceeding boundaries', () => {
      expect(() => validateBoundingBox({ x: 80, y: 20, width: 30, height: 40 })).toThrow(
        'exceeds right boundary'
      )
      expect(() => validateBoundingBox({ x: 10, y: 80, width: 30, height: 40 })).toThrow(
        'exceeds bottom boundary'
      )
    })

    it('should throw ValidationError for too small boxes', () => {
      expect(() => validateBoundingBox({ x: 10, y: 20, width: 0.05, height: 40 })).toThrow(
        'Width must be at least 0.1%'
      )
    })
  })

  describe('isValidBoundingBox', () => {
    it('should return true for valid box', () => {
      expect(isValidBoundingBox({ x: 10, y: 20, width: 30, height: 40 })).toBe(true)
    })

    it('should return false for invalid box', () => {
      expect(isValidBoundingBox({ x: -1, y: 20, width: 30, height: 40 })).toBe(false)
      expect(isValidBoundingBox({ x: 10, y: 20 } as any)).toBe(false)
    })
  })

  describe('filterValidElements', () => {
    it('should filter out invalid elements', () => {
      const elements = [
        { boundingBox: { x: 10, y: 20, width: 30, height: 40 }, id: '1' },
        { boundingBox: { x: -1, y: 20, width: 30, height: 40 }, id: '2' },
        { boundingBox: { x: 50, y: 60, width: 20, height: 30 }, id: '3' },
      ]

      const result = filterValidElements(elements)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('3')
    })
  })

  describe('validateNonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(validateNonEmptyString('test', 'field')).toBe('test')
      expect(validateNonEmptyString('  test  ', 'field')).toBe('test')
    })

    it('should throw for empty strings', () => {
      expect(() => validateNonEmptyString('', 'field')).toThrow(ValidationError)
      expect(() => validateNonEmptyString('   ', 'field')).toThrow('field cannot be empty')
      expect(() => validateNonEmptyString(null, 'field')).toThrow(ValidationError)
    })
  })

  describe('validateUUID', () => {
    it('should validate correct UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(validateUUID(uuid, 'id')).toBe(uuid)
    })

    it('should throw for invalid UUIDs', () => {
      expect(() => validateUUID('not-a-uuid', 'id')).toThrow('must be a valid UUID')
      expect(() => validateUUID('', 'id')).toThrow('is required')
      expect(() => validateUUID(null, 'id')).toThrow('is required')
    })
  })

  describe('validateImageFile', () => {
    it('should validate image files', () => {
      const file = new File([''], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
      
      expect(() => validateImageFile(file)).not.toThrow()
    })

    it('should throw for non-image files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      expect(() => validateImageFile(file)).toThrow('must be an image')
    })

    it('should throw for files too large', () => {
      const file = new File([''], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }) // 11MB
      
      expect(() => validateImageFile(file)).toThrow('must be less than 10MB')
    })
  })

  describe('ValidationError', () => {
    it('should create proper error object', () => {
      const error = new ValidationError('fieldName', 'error message', { extra: 'data' })
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('ValidationError')
      expect(error.field).toBe('fieldName')
      expect(error.message).toBe('error message')
      expect(error.details).toEqual({ extra: 'data' })
    })
  })
})

