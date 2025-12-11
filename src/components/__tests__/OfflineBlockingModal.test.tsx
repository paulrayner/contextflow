import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OfflineBlockingModal } from '../OfflineBlockingModal'
import { useCollabStore } from '../../model/collabStore'

describe('OfflineBlockingModal', () => {
  beforeEach(() => {
    useCollabStore.getState().reset()
  })

  describe('visibility', () => {
    it('does not render when connection state is disconnected', () => {
      useCollabStore.getState().setConnectionState('disconnected')

      const { container } = render(<OfflineBlockingModal />)

      expect(container.firstChild).toBeNull()
    })

    it('does not render when connection state is connecting', () => {
      useCollabStore.getState().setConnectionState('connecting')

      const { container } = render(<OfflineBlockingModal />)

      expect(container.firstChild).toBeNull()
    })

    it('does not render when connection state is connected', () => {
      useCollabStore.getState().setConnectionState('connected')

      const { container } = render(<OfflineBlockingModal />)

      expect(container.firstChild).toBeNull()
    })

    it('does not render when connection state is syncing', () => {
      useCollabStore.getState().setConnectionState('syncing')

      const { container } = render(<OfflineBlockingModal />)

      expect(container.firstChild).toBeNull()
    })

    it('renders when connection state is offline', () => {
      useCollabStore.getState().setConnectionState('offline')

      render(<OfflineBlockingModal />)

      expect(screen.getByText("You're Offline")).toBeInTheDocument()
    })

    it('renders when connection state is error', () => {
      useCollabStore.getState().setConnectionState('error')

      render(<OfflineBlockingModal />)

      expect(screen.getByText("You're Offline")).toBeInTheDocument()
    })

    it('renders when connection state is reconnecting', () => {
      useCollabStore.getState().setConnectionState('reconnecting')

      render(<OfflineBlockingModal />)

      expect(screen.getByRole('heading', { name: 'Reconnecting...' })).toBeInTheDocument()
    })

    it('does not render when connection state is reconnecting but then connects', () => {
      useCollabStore.getState().setConnectionState('reconnecting')

      const { rerender } = render(<OfflineBlockingModal />)

      expect(screen.getByRole('heading', { name: 'Reconnecting...' })).toBeInTheDocument()

      useCollabStore.getState().setConnectionState('connected')
      rerender(<OfflineBlockingModal />)

      expect(screen.queryByRole('heading', { name: 'Reconnecting...' })).not.toBeInTheDocument()
    })
  })

  describe('content', () => {
    it('displays the offline message', () => {
      useCollabStore.getState().setConnectionState('offline')

      render(<OfflineBlockingModal />)

      expect(screen.getByText(/To access this shared project/)).toBeInTheDocument()
    })

    it('displays sync message', () => {
      useCollabStore.getState().setConnectionState('offline')

      render(<OfflineBlockingModal />)

      expect(screen.getByText(/Your changes will sync automatically/)).toBeInTheDocument()
    })

    it('displays retry connection button', () => {
      useCollabStore.getState().setConnectionState('offline')

      render(<OfflineBlockingModal />)

      expect(screen.getByRole('button', { name: /Retry Connection/i })).toBeInTheDocument()
    })
  })

  describe('error display', () => {
    it('displays error message when error exists', () => {
      useCollabStore.getState().setError('Connection timeout')

      render(<OfflineBlockingModal />)

      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    })

    it('does not display error box when no error', () => {
      useCollabStore.getState().setConnectionState('offline')

      render(<OfflineBlockingModal />)

      expect(screen.queryByText(/Connection timeout/)).not.toBeInTheDocument()
    })
  })

  describe('retry functionality', () => {
    it('triggers connection when retry button is clicked', async () => {
      useCollabStore.getState().setConnectionState('offline')
      useCollabStore.getState().setActiveProjectId('test-project-123')

      const connectToProjectSpy = vi.spyOn(useCollabStore.getState(), 'connectToProject')
      connectToProjectSpy.mockResolvedValue()

      render(<OfflineBlockingModal />)

      const retryButton = screen.getByRole('button', { name: /Retry Connection/i })
      expect(retryButton).toBeInTheDocument()

      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(connectToProjectSpy).toHaveBeenCalledWith('test-project-123')
      })

      connectToProjectSpy.mockRestore()
    })

    it('does not attempt retry if no active project id', async () => {
      useCollabStore.getState().setConnectionState('offline')
      // No activeProjectId set - remains null

      render(<OfflineBlockingModal />)

      const retryButton = screen.getByRole('button', { name: /Retry Connection/i })
      fireEvent.click(retryButton)

      // Button text should not change since no projectId to connect to
      expect(screen.getByRole('button', { name: /Retry Connection/i })).toBeInTheDocument()
    })
  })

  describe('reconnecting state', () => {
    it('shows reconnecting header and attempt count', () => {
      const store = useCollabStore.getState()
      store.setConnectionState('reconnecting')
      // Manually set reconnectAttempts by accessing the internal state
      useCollabStore.setState({ reconnectAttempts: 2 })

      render(<OfflineBlockingModal />)

      expect(screen.getByRole('heading', { name: 'Reconnecting...' })).toBeInTheDocument()
      expect(screen.getByText(/Attempting to reconnect \(attempt 2 of 5\)/)).toBeInTheDocument()
    })

    it('disables retry button during reconnecting', () => {
      useCollabStore.getState().setConnectionState('reconnecting')
      useCollabStore.getState().setActiveProjectId('test-project-123')

      render(<OfflineBlockingModal />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('does not show sync message during reconnecting', () => {
      useCollabStore.getState().setConnectionState('reconnecting')

      render(<OfflineBlockingModal />)

      expect(screen.queryByText(/Your changes will sync automatically/)).not.toBeInTheDocument()
    })
  })
})
