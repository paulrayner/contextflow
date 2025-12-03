import { vi } from 'vitest'
import '@testing-library/jest-dom'

let store: Record<string, string> = {}

const localStorageMock: Storage = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key]
  }),
  clear: vi.fn(() => {
    store = {}
  }),
  key: vi.fn(() => null),
  length: 0,
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

const indexedDBMock = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
  })),
}

Object.defineProperty(globalThis, 'indexedDB', {
  value: indexedDBMock,
  writable: true,
})
