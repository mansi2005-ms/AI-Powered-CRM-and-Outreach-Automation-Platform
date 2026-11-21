// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import History from '../History'

afterEach(() => {
  cleanup()
})

describe('History', () => {
  it('renders the page header and audit table columns', () => {
    render(<History />)

    expect(screen.getByText('Enrichment History')).toBeTruthy()
    expect(
      screen.getByText('Audit history of previous enrichment lookups.')
    ).toBeTruthy()
    expect(screen.getByText('Requester')).toBeTruthy()
    expect(screen.getByText('Timestamp')).toBeTruthy()
    expect(screen.getByText('Provider')).toBeTruthy()
    expect(screen.getByText('Outcome')).toBeTruthy()
    expect(screen.getByText('Credits')).toBeTruthy()
    expect(screen.getByText('Email Provenance')).toBeTruthy()
  })

  it('renders the enrichment history row with formatted timestamp and status', () => {
    render(<History />)

    const expectedTimestamp = new Date('2026-10-30T10:30:00').toLocaleString()

    expect(screen.getByText('requester 1')).toBeTruthy()
    expect(screen.getByText(expectedTimestamp)).toBeTruthy()
    expect(screen.getByText('Apollo')).toBeTruthy()
    expect(screen.getByText('Success')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('LinkedIn')).toBeTruthy()
  })

  it('shows single-page pagination summary with navigation buttons disabled', () => {
    render(<History />)

    expect(screen.queryByText('No enrichment history found')).toBeNull()
    expect(screen.getByText('Showing 1 record(s)')).toBeTruthy()
    expect(screen.getByText('Page 1 of 1')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Previous' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Next' }).disabled).toBe(true)
  })
})
