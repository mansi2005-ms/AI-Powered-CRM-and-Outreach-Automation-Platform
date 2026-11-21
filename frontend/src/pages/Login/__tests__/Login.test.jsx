// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import LoginPage from '../index'
import { apiClient } from '../../../api/client'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../../api/client', () => ({
  apiClient: vi.fn(),
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  it('renders login form with empty inputs and demo buttons initially', () => {
    render(<LoginPage />)

    expect(screen.getByText('AI CRM & Outreach Platform')).toBeTruthy()
    expect(screen.getByPlaceholderText('intern@example.com').value).toBe('')
    expect(screen.getByPlaceholderText('••••••••').value).toBe('')
    expect(screen.getByText('Sign In')).toBeTruthy()
    expect(screen.getByText('Admin')).toBeTruthy()
    expect(screen.getByText('Researcher')).toBeTruthy()
    expect(screen.getByText('Campaign Mgr')).toBeTruthy()
    expect(screen.getByText('Developer')).toBeTruthy()
  })

  it('fills email and password when a Quick Demo Login button is clicked', () => {
    render(<LoginPage />)

    const demo = [
      {
        label: 'Admin',
        email: 'admin@example.com',
      },
      {
        label: 'Researcher',
        email: 'researcher@example.com',
      },
      {
        label: 'Campaign Mgr',
        email: 'campaigns@example.com',
      },
      {
        label: 'Developer',
        email: 'developer@example.com',
      },
    ]

    demo.forEach(({ label, email }) => {
      fireEvent.click(screen.getByText(label))
      expect(screen.getByPlaceholderText('intern@example.com').value).toBe(
        email
      )
      expect(screen.getByPlaceholderText('••••••••').value).toBe('Password123!')
    })
  })

  it('shows loading state on submit button while login request is in progress', async () => {
    let resolveLogin
    apiClient.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        })
    )

    const { container } = render(<LoginPage />)

    fireEvent.click(screen.getByText('Admin'))
    const submitBtn = container.querySelector('button[type="submit"]')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(submitBtn.disabled).toBe(true)
    })

    resolveLogin({
      access_token: 'fake-token',
      user: { email: 'admin@example.com', role: 'admin' },
    })

    await waitFor(() => {
      expect(submitBtn.disabled).toBe(false)
    })
  })

  it('saves auth data, calls onLoginSuccess, and navigates to /pipeline on success', async () => {
    const fakeUser = { email: 'admin@example.com', role: 'admin' }
    apiClient.mockResolvedValueOnce({
      access_token: 'test-token-123',
      user: fakeUser,
    })
    const mockOnLoginSuccess = vi.fn()

    const { container } = render(
      <LoginPage onLoginSuccess={mockOnLoginSuccess} />
    )

    fireEvent.change(screen.getByPlaceholderText('intern@example.com'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123!' },
    })
    fireEvent.click(container.querySelector('button[type="submit"]'))

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'Password123!',
        }),
      })
      expect(localStorage.getItem('auth_token')).toBe('test-token-123')
      expect(JSON.parse(localStorage.getItem('auth_user'))).toEqual(fakeUser)
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(fakeUser)
      expect(mockNavigate).toHaveBeenCalledWith('/pipeline')
    })
  })

  it('displays error banner when login API fails', async () => {
    apiClient.mockRejectedValueOnce(new Error('Invalid credentials'))

    const { container } = render(<LoginPage />)

    fireEvent.click(screen.getByText('Admin'))
    fireEvent.click(container.querySelector('button[type="submit"]'))

    const errorMsg = await screen.findByText('Invalid credentials')
    expect(errorMsg).toBeTruthy()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
