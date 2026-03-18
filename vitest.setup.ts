import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
  }),
}))
