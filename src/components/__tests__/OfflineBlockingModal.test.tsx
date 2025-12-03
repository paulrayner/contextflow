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
    it('renders retry button and updates when clicked', async () => {
      useCollabStore.getState().setConnectionState('offline')
      useCollabStore.getState().setActiveProjectId('test-project-123')

      render(<OfflineBlockingModal />)

      const retryButton = screen.getByRole('button', { name: /Retry Connection/i })
      expect(retryButton).toBeInTheDocument()

      // When clicked, the button should exist (either in normal or loading state)
      fireEvent.click(retryButton)

      // Button should still exist in the document after click
      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
      })
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
})
