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
import EnrichmentQueuePage from '../index'
import {
  DEFAULT_PROVIDER,
  enrichLeads,
  getCreditBudget,
  getEnrichmentQueue,
} from '../../../api/enrichment'

vi.mock('../../../api/enrichment', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getEnrichmentQueue: vi.fn(),
    getCreditBudget: vi.fn(),
    enrichLeads: vi.fn(),
  }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const MOCK_ITEMS = [
  {
    id: 'lead-1',
    contact_name: 'Jane Smith',
    organization_name: 'Acme Robotics',
    title: 'Junior Robotics Engineer',
    discovered_at: '2026-10-15T10:00:00Z',
    missing_fields: ['email', 'phone'],
  },
  {
    id: 'lead-2',
    contact_name: null,
    organization_name: 'Global AI Tech',
    title: 'Frontend Developer Intern',
    discovered_at: '2026-10-14T10:00:00Z',
    missing_fields: ['email'],
  },
]

describe('EnrichmentQueuePage', () => {
  it('shows loading state while enrichment queue is fetching', async () => {
    let resolveQueue
    getEnrichmentQueue.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveQueue = resolve
        })
    )

    render(<EnrichmentQueuePage currentUser={{ role: 'researcher' }} />)

    const refreshBtn = screen.getByRole('button', { name: /refresh/i })
    expect(refreshBtn.disabled).toBe(true)
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText('The enrichment queue is empty')).toBeNull()

    resolveQueue({ items: [], total: 0 })

    await waitFor(() => {
      expect(refreshBtn.disabled).toBe(false)
    })
  })

  it('renders enrichment queue rows and summary on successful API response', async () => {
    getEnrichmentQueue.mockResolvedValueOnce({
      items: MOCK_ITEMS,
      total: 2,
    })

    render(<EnrichmentQueuePage currentUser={{ role: 'researcher' }} />)

    expect(await screen.findByText('Acme Robotics')).toBeTruthy()
    expect(screen.getByText('Jane Smith')).toBeTruthy()
    expect(screen.getByText(/Junior Robotics Engineer/)).toBeTruthy()
    expect(screen.getByText('Global AI Tech')).toBeTruthy()
    expect(screen.getByText('Not identified yet')).toBeTruthy()
    expect(screen.getByText(/Frontend Developer Intern/)).toBeTruthy()
    expect(
      screen.getByText('Showing 2 of 2 leads waiting for enrichment')
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /enrich contact/i }).disabled
    ).toBe(true)
  })

  it('displays empty state when the queue returns zero leads', async () => {
    getEnrichmentQueue.mockResolvedValueOnce({
      items: [],
      total: 0,
    })

    render(<EnrichmentQueuePage currentUser={{ role: 'researcher' }} />)

    expect(
      await screen.findByText('The enrichment queue is empty')
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('displays error banner when loading the queue fails', async () => {
    getEnrichmentQueue.mockRejectedValueOnce(new Error('Failed to fetch queue'))

    render(<EnrichmentQueuePage currentUser={{ role: 'researcher' }} />)

    expect(await screen.findByText('Failed to fetch queue')).toBeTruthy()
    expect(screen.queryByText('The enrichment queue is empty')).toBeNull()
  })

  it('selects a lead, confirms credit usage, and enriches the contact', async () => {
    getEnrichmentQueue.mockResolvedValueOnce({
      items: MOCK_ITEMS,
      total: 2,
    })
    getCreditBudget.mockResolvedValueOnce({
      dailyBudget: 50,
      dailyUsed: 10,
      monthlyBudget: 500,
      monthlyUsed: 100,
    })
    enrichLeads.mockResolvedValueOnce([
      {
        leadId: 'lead-1',
        provider: DEFAULT_PROVIDER,
        status: 'enriched',
        creditsUsed: 2,
      },
    ])

    render(<EnrichmentQueuePage currentUser={{ role: 'researcher' }} />)

    await screen.findByText('Acme Robotics')

    const enrichBtn = screen.getByRole('button', { name: /enrich contact/i })
    expect(enrichBtn.disabled).toBe(true)

    fireEvent.click(screen.getByLabelText('Select Acme Robotics'))
    expect(enrichBtn.disabled).toBe(false)
    expect(enrichBtn.textContent).toContain('(1)')

    fireEvent.click(enrichBtn)

    expect(
      await screen.findByText('Confirm enrichment & credit usage')
    ).toBeTruthy()
    expect(await screen.findByText('40 of 50')).toBeTruthy()

    const confirmBtn = screen.getByRole('button', {
      name: /confirm & deduct credits/i,
    })
    await waitFor(() => {
      expect(confirmBtn.disabled).toBe(false)
    })

    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(enrichLeads).toHaveBeenCalledWith(
        [{ leadId: 'lead-1', provider: DEFAULT_PROVIDER }],
        expect.objectContaining({ onProgress: expect.any(Function) })
      )
      expect(screen.getByText('1 enriched. 2 credits used.')).toBeTruthy()
    })

    expect(screen.queryByLabelText('Select Acme Robotics')).toBeNull()
    expect(screen.getByText('Enriched – left the queue')).toBeTruthy()
  })
})
