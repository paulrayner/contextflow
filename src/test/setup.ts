import { vi } from 'vitest'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as any

const indexedDBMock = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
  })),
}

global.indexedDB = indexedDBMock as any
