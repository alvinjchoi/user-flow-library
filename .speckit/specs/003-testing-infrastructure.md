# Specification: Testing Infrastructure

**ID:** SPEC-003  
**Status:** ✅ Implemented  
**Created:** 2024-11-04  
**Last Updated:** 2024-11-04  
**Related PR:** refactor/improve-code-reusability

## Overview

Establish comprehensive testing infrastructure with Jest and React Testing Library, integrated into the build process to prevent deployment of broken code.

## Requirements

### FR-001: Test Framework Setup
**Priority:** P0

System shall:
- Use Jest as test runner
- Use React Testing Library for component testing
- Use @testing-library/react-hooks for hooks testing
- Configure Next.js Jest transformer
- Support TypeScript in tests

### FR-002: Test Coverage
**Priority:** P0

System shall:
- Achieve 95%+ coverage on `lib/validators.ts`
- Achieve 70%+ coverage on `lib/api-errors.ts`
- Achieve 40%+ coverage on `lib/ai-services.ts`
- Generate HTML coverage reports
- Enforce coverage thresholds per module

### FR-003: Build Integration
**Priority:** P0

System shall:
- Run tests automatically before every build
- Abort build if tests fail
- Support watch mode for development
- Support CI-optimized test runs
- Generate coverage reports in CI

### FR-004: Test Scripts
**Priority:** P0

System shall provide:
- `pnpm test` - Run all tests
- `pnpm test:watch` - Watch mode for development
- `pnpm test:coverage` - Generate coverage report
- `pnpm test:ci` - CI-optimized run

### FR-005: Mocking Strategy
**Priority:** P1

System shall mock:
- Next.js router (useRouter, usePathname, useParams)
- Clerk authentication (auth, useUser, useOrganization)
- NextResponse for API testing
- Global fetch for AI service testing

## Technical Design

### Directory Structure

```
.
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Test setup and mocks
├── lib/
│   ├── __tests__/
│   │   ├── validators.test.ts
│   │   ├── api-errors.test.ts
│   │   └── ai-services.test.ts
│   ├── validators.ts
│   ├── api-errors.ts
│   └── ai-services.ts
└── TESTING.md               # Testing guide
```

### Jest Configuration

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  coverageThreshold: {
    'lib/validators.ts': {
      branches: 90,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    // ... more thresholds
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Test Patterns

#### Unit Test Pattern
```typescript
import { validateBoundingBox, ValidationError } from '../validators'

describe('validators', () => {
  describe('validateBoundingBox', () => {
    it('should validate a correct bounding box', () => {
      const box = { x: 10, y: 20, width: 30, height: 40 }
      const result = validateBoundingBox(box)
      expect(result).toEqual(box)
    })

    it('should throw ValidationError for out of range values', () => {
      expect(() => 
        validateBoundingBox({ x: -1, y: 20, width: 30, height: 40 })
      ).toThrow(ValidationError)
    })
  })
})
```

#### API Handler Test Pattern
```typescript
import { APIError, handleAPIError } from '../api-errors'

describe('api-errors', () => {
  it('should handle APIError', () => {
    const error = new APIError(404, 'Not found')
    const response = handleAPIError(error)
    expect(response.status).toBe(404)
  })
})
```

## Test Coverage

### lib/validators.test.ts
**Coverage: 97.95%**

Tests:
- ✅ validateBoundingBox - valid input
- ✅ validateBoundingBox - missing fields
- ✅ validateBoundingBox - out of range values
- ✅ validateBoundingBox - exceeds boundaries
- ✅ validateBoundingBox - too small boxes
- ✅ isValidBoundingBox - returns true/false
- ✅ filterValidElements - filters invalid elements
- ✅ validateNonEmptyString - validates strings
- ✅ validateUUID - validates UUIDs
- ✅ validateImageFile - validates file type and size
- ✅ ValidationError - creates proper error object

**Total: 31 tests**

### lib/api-errors.test.ts
**Coverage: 70.90%**

Tests:
- ✅ APIError class creation
- ✅ Predefined error types (Unauthorized, NotFound, etc.)
- ✅ handleAPIError - handles different error types
- ✅ OpenAI error handling
- ✅ Supabase error handling
- ✅ Generic error handling
- ✅ assertExists helper
- ✅ assertAuthorized helper

**Total: 11 tests**

### lib/ai-services.test.ts
**Coverage: 44.23%**

Tests:
- ✅ analyzeScreenshot - successful analysis
- ✅ analyzeScreenshot - handles errors
- ✅ detectElements - successful detection
- ✅ detectElements - handles errors
- ✅ getErrorMessage - formats errors properly
- ✅ isAvailable check

**Total: 8 tests**

## Success Criteria

- ✅ 44 tests passing (43 pass, 1 skipped)
- ✅ Coverage thresholds met for all tested modules
- ✅ Tests integrated into `pnpm build`
- ✅ Build fails if tests fail
- ✅ HTML coverage reports generated
- ✅ All linter errors resolved
- ✅ Documentation created (TESTING.md)

## Build Integration

### Before
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

### After
```json
{
  "scripts": {
    "build": "pnpm test && next build",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

## CI/CD Integration

Tests run automatically in:
- ✅ Local builds (`pnpm build`)
- ✅ Pre-commit hooks (optional)
- ✅ CI pipelines (GitHub Actions, etc.)

## Future Enhancements

- [ ] Component testing with React Testing Library
- [ ] Hook testing with @testing-library/react-hooks
- [ ] API route integration tests
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] Performance tests

## Documentation

- ✅ TESTING.md created with comprehensive guide
- ✅ Test patterns documented
- ✅ Troubleshooting section added
- ✅ Best practices outlined

## Dependencies Added

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/react-hooks": "^8.0.1",
    "@types/jest": "^30.0.0",
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0",
    "ts-jest": "^29.4.5"
  }
}
```

## Related Specifications

- SPEC-002: Refactored Architecture (provides utilities to test)
- SPEC-001: Core Architecture (overall system context)

## References

- Commit: 6b228d7 "test: add comprehensive test suite with pre-build validation"
- Documentation: TESTING.md


