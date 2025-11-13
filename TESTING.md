# Testing Guide

This project uses Jest and React Testing Library for comprehensive testing.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode (for deployment)
pnpm test:ci
```

## Test Integration with Build

**Tests run automatically before every build!**

When you run `pnpm build`, tests will execute first. If any tests fail, the build will be aborted. This ensures:
- ✅ No broken code gets deployed
- ✅ All utility functions work as expected
- ✅ Regressions are caught early

## Test Structure

Tests are organized in `__tests__` directories next to the code they test:

```
lib/
├── validators.ts
├── api-errors.ts
├── ai-services.ts
└── __tests__/
    ├── validators.test.ts      (97.95% coverage)
    ├── api-errors.test.ts      (70.90% coverage)
    └── ai-services.test.ts     (44.23% coverage)
```

## What's Tested

### 1. Validators (`lib/validators.ts`)
- ✅ Bounding box validation
- ✅ Element filtering
- ✅ String validation
- ✅ UUID validation
- ✅ Image file validation
- ✅ ValidationError class

**Coverage: 97.95%**

### 2. API Error Handling (`lib/api-errors.ts`)
- ✅ APIError class creation
- ✅ Predefined error types (Unauthorized, NotFound, etc.)
- ✅ Error handler for different error types
- ✅ OpenAI error handling
- ✅ Supabase error handling
- ✅ Generic error handling
- ✅ Assertion helpers

**Coverage: 70.90%**

### 3. AI Services (`lib/ai-services.ts`)
- ✅ Screenshot analysis
- ✅ Element detection
- ✅ Error handling
- ✅ Error message formatting

**Coverage: 44.23%**

## Test Configuration

### Jest Setup (`jest.setup.js`)
- Mocks Next.js router
- Mocks Clerk authentication
- Suppresses console errors in tests
- Sets up testing environment

### Coverage Thresholds

Coverage is enforced per-file for tested modules:
- **validators.ts**: 95%+ (comprehensive testing)
- **api-errors.ts**: 65%+ (core error handling)
- **ai-services.ts**: 40%+ (API integration)

## Writing New Tests

1. Create a `__tests__` directory next to your code
2. Name test files: `filename.test.ts` or `filename.test.tsx`
3. Follow the existing test patterns
4. Run `pnpm test:watch` while developing

Example:
```typescript
import { myFunction } from '../myModule'

describe('myModule', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      const result = myFunction('input')
      expect(result).toBe('expected')
    })

    it('should handle errors', () => {
      expect(() => myFunction(null)).toThrow()
    })
  })
})
```

## CI/CD Integration

The `test:ci` command is optimized for CI environments:
- Uses `--ci` flag for better logging
- Includes coverage report
- Uses `--maxWorkers=2` for better resource usage
- Non-interactive mode

## Future Test Coverage

Planned test expansion:
- [ ] React hooks (`hooks/`)
- [ ] React components (`components/`)
- [ ] API routes integration tests
- [ ] E2E tests with Playwright

## Troubleshooting

### Tests fail in CI but pass locally
- Ensure you're using the same Node version
- Run `pnpm test:ci` locally to replicate CI environment

### Coverage threshold not met
- Check which lines are uncovered: `pnpm test:coverage`
- Add tests for uncovered branches
- Update thresholds if needed (in `jest.config.js`)

### Mock errors
- Check `jest.setup.js` for mock configuration
- Ensure mocks match the actual module interface

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **One assertion per test when possible**
4. **Mock external dependencies**
5. **Keep tests fast and isolated**
6. **Run tests before committing**

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

