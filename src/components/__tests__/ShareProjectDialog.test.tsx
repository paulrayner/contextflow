import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareProjectDialog } from '../ShareProjectDialog'
import { useCollabStore } from '../../model/collabStore'
import { useEditorStore } from '../../model/store'

// Mock the stores
vi.mock('../../model/collabStore', () => ({
  useCollabStore: vi.fn(),
}))

vi.mock('../../model/store', () => ({
  useEditorStore: vi.fn(),
}))

describe('ShareProjectDialog', () => {
  const defaultProps = {
    projectId: 'test-project-123',
    projectName: 'Test Project',
    onClose: vi.fn(),
  }

  const mockSetActiveProject = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock: disconnected state
    vi.mocked(useCollabStore).mockImplementation((selector) => {
      const state = {
        connectionState: 'disconnected' as const,
      }
      return selector(state as never)
    })

    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        setActiveProject: mockSetActiveProject,
      }
      return selector(state as never)
    })
  })

  describe('when already connected to cloud', () => {
    beforeEach(() => {
      vi.mocked(useCollabStore).mockImplementation((selector) => {
        const state = {
          connectionState: 'connected' as const,
        }
        return selector(state as never)
      })
    })

    it('shows share URL immediately without connecting state', async () => {
      render(<ShareProjectDialog {...defaultProps} />)

      // Click "Share Anyway" on confirmation screen
      const shareButton = screen.getByRole('button', { name: /Share Anyway/i })
      fireEvent.click(shareButton)

      // Should immediately show URL screen (no "Connecting..." state)
      await waitFor(() => {
        expect(screen.getByText(/Share Link/i)).toBeInTheDocument()
      })

      // Should NOT have called setActiveProject since already connected
      expect(mockSetActiveProject).not.toHaveBeenCalled()
    })
  })

  describe('when not connected to cloud', () => {
    it('shows "Connecting..." state when Share Anyway is clicked', async () => {
      // Make selectProject hang to observe the connecting state
      mockSetActiveProject.mockImplementation(() => new Promise(() => {}))

      render(<ShareProjectDialog {...defaultProps} />)

      const shareButton = screen.getByRole('button', { name: /Share Anyway/i })
      fireEvent.click(shareButton)

      // Should show connecting state
      await waitFor(() => {
        expect(screen.getByText(/Connecting/i)).toBeInTheDocument()
      })
    })

    it('disables button during connection', async () => {
      mockSetActiveProject.mockImplementation(() => new Promise(() => {}))

      render(<ShareProjectDialog {...defaultProps} />)

      const shareButton = screen.getByRole('button', { name: /Share Anyway/i })
      fireEvent.click(shareButton)

      await waitFor(() => {
        const connectingButton = screen.getByRole('button', { name: /Connecting/i })
        expect(connectingButton).toBeDisabled()
      })
    })

    it('shows share URL after successful connection', async () => {
      mockSetActiveProject.mockResolvedValue(undefined)

      render(<ShareProjectDialog {...defaultProps} />)

      const shareButton = screen.getByRole('button', { name: /Share Anyway/i })
      fireEvent.click(shareButton)

      // Should show URL screen after connection succeeds
      await waitFor(() => {
        expect(screen.getByText(/Share Link/i)).toBeInTheDocument()
      })
    })

    it('calls setActiveProject with correct projectId', async () => {
      mockSetActiveProject.mockResolvedValue(undefined)

      render(<ShareProjectDialog {...defaultProps} />)

      const shareButton = screen.getByRole('button', { name: /Share Anyway/i })
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(mockSetActiveProject).toHaveBeenCalledWith('test-project-123')
      })
    })
  })

  describe('connection errors', () => {
    it('shows error message on connection failure', async () => {
      mockSetActiveProject.mockRejectedValue(new Error('Connection failed'))

      render(<ShareProjectDialog {...defaultProps} />)

      const shareButton = screen.getByRole('button', { name: /Share Anyway/i })
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect/i)).toBeInTheDocument()
      })
    })

    it('allows retry after error', async () => {
      mockSetActiveProject
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined)

      render(<ShareProjectDialog {...defaultProps} />)

      // First attempt - fails
      const shareButton = screen.getByRole('button', { name: /Share Anyway/i })
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect/i)).toBeInTheDocument()
      })

      // Retry button should be available
      const retryButton = screen.getByRole('button', { name: /Share Anyway/i })
      expect(retryButton).not.toBeDisabled()

      // Second attempt - succeeds
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/Share Link/i)).toBeInTheDocument()
      })
    })
  })
})
