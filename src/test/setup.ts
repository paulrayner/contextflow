import { vi } from 'vitest'

let store: Record<string, string> = {}

const localStorageMock = {
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
}

global.localStorage = localStorageMock as any

const indexedDBMock = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
  })),
}

global.indexedDB = indexedDBMock as any
