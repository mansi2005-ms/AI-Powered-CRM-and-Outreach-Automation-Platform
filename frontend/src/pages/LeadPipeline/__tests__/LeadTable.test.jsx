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
import { LeadTable } from '../LeadTable'
import { listLeads } from '../../../api/leads'

vi.mock('../../../api/leads', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    listLeads: vi.fn(),
  }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const MOCK_LEADS = [
  {
    id: 'lead-1',
    organization_name: 'Acme Robotics',
    title: 'Frontend Engineer',
    location: 'Bengaluru',
    source_name: 'LinkedIn',
    experience_min: 0,
    experience_max: 0,
    score: 92,
    score_band: 'high',
    status: 'verified',
    assigned_to: 'user-1',
    discovered_at: '2026-10-15T10:00:00Z',
  },
  {
    id: 'lead-2',
    organization_name: 'Nova AI',
    title: 'Python Developer',
    location: null,
    source_name: 'Internshala',
    experience_min: 1,
    experience_max: 3,
    score: 78,
    score_band: 'medium',
    status: 'needs_enrichment',
    assigned_to: null,
    discovered_at: '2026-10-14T10:00:00Z',
  },
]

describe('LeadTable', () => {
  it('shows loading state while leads are being fetched', async () => {
    let resolveLeads
    listLeads.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLeads = resolve
        })
    )

    render(<LeadTable onSelect={vi.fn()} />)

    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText('No leads match your criteria')).toBeNull()

    resolveLeads({
      items: [],
      total: 0,
      page: 1,
      page_size: 25,
      total_pages: 1,
    })

    expect(await screen.findByText('No leads match your criteria')).toBeTruthy()
  })

  it('renders lead rows, formatted fields, and pagination summary on success', async () => {
    listLeads.mockResolvedValueOnce({
      items: MOCK_LEADS,
      total: 2,
      page: 1,
      page_size: 25,
      total_pages: 1,
    })

    render(<LeadTable onSelect={vi.fn()} currentUserId="user-1" />)

    expect(await screen.findByText('Acme Robotics')).toBeTruthy()
    expect(screen.getByText('Frontend Engineer')).toBeTruthy()
    expect(screen.getByText('Fresher')).toBeTruthy()
    expect(screen.getByText('You')).toBeTruthy()

    expect(screen.getByText('Nova AI')).toBeTruthy()
    expect(screen.getByText('Python Developer')).toBeTruthy()
    expect(screen.getByText('1–3 yrs')).toBeTruthy()
    expect(screen.getByText('Unassigned')).toBeTruthy()
    expect(screen.getByText('Showing 1–2 of 2 leads')).toBeTruthy()
  })

  it('displays empty state when API returns zero leads', async () => {
    listLeads.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      page_size: 25,
      total_pages: 1,
    })

    render(<LeadTable onSelect={vi.fn()} />)

    expect(await screen.findByText('No leads match your criteria')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('displays error banner when loading leads fails', async () => {
    listLeads.mockRejectedValueOnce(new Error('Failed to load pipeline'))

    render(<LeadTable onSelect={vi.fn()} />)

    expect(await screen.findByText('Failed to load pipeline')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('calls onSelect when a lead row is clicked and re-fetches when sorting changes', async () => {
    const onSelect = vi.fn()
    listLeads
      .mockResolvedValueOnce({
        items: MOCK_LEADS,
        total: 2,
        page: 1,
        page_size: 25,
        total_pages: 1,
      })
      .mockResolvedValueOnce({
        items: MOCK_LEADS,
        total: 2,
        page: 1,
        page_size: 25,
        total_pages: 1,
      })

    render(<LeadTable onSelect={onSelect} />)

    const firstOrgCell = await screen.findByText('Acme Robotics')
    fireEvent.click(firstOrgCell)

    expect(onSelect).toHaveBeenCalledWith('lead-1', MOCK_LEADS[0])

    fireEvent.click(screen.getByRole('button', { name: /organization/i }))

    await waitFor(() => {
      expect(listLeads).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          sortBy: 'organization_name',
          sortOrder: 'asc',
        })
      )
    })
  })
})
