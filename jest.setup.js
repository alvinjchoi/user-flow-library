import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useParams() {
    return {}
  },
}))

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  useOrganization: jest.fn(),
  SignedIn: ({ children }) => children,
  SignedOut: ({ children }) => null,
  UserButton: () => null,
  OrganizationSwitcher: () => null,
}))

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

