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
import Controls from '../Controls'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Controls', () => {
  it('disables dispatch controls and shows approval alert when campaign is unapproved', () => {
    render(
      <Controls
        campaignName="Q4 Outreach"
        approved={false}
        onSend={vi.fn()}
        onSchedule={vi.fn()}
        onPause={vi.fn()}
      />
    )

    expect(screen.getByText('Campaign Dispatch Controls')).toBeTruthy()
    expect(screen.getByText(/Awaiting FE-23 approval/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /send now/i }).disabled).toBe(
      true
    )
    expect(
      screen.getByRole('button', { name: /confirm schedule/i }).disabled
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: /pause campaign/i }).disabled
    ).toBe(true)
  })

  it('shows loading state while confirming Send Now and displays success notice', async () => {
    let resolveSend
    const onSend = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve
        })
    )

    render(
      <Controls campaignName="Q4 Outreach" approved={true} onSend={onSend} />
    )

    fireEvent.click(screen.getByRole('button', { name: /send now/i }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Confirm campaign action')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /yes, confirm/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /working/i }).disabled).toBe(
        true
      )
    })
    expect(screen.getByRole('button', { name: /cancel/i }).disabled).toBe(true)

    resolveSend()

    await waitFor(() => {
      expect(screen.getByText('Action completed successfully.')).toBeTruthy()
    })
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('displays error notice and re-enables controls when dispatch handler rejects', async () => {
    const onSend = vi
      .fn()
      .mockRejectedValueOnce(new Error('Dispatch service unavailable'))

    render(
      <Controls campaignName="Q4 Outreach" approved={true} onSend={onSend} />
    )

    const sendBtn = screen.getByRole('button', { name: /send now/i })
    fireEvent.click(sendBtn)
    fireEvent.click(screen.getByRole('button', { name: /yes, confirm/i }))

    expect(await screen.findByText('Dispatch service unavailable')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(sendBtn.disabled).toBe(false)
  })

  it('blocks send and schedule when paused and allows confirming resume', async () => {
    const onResume = vi.fn().mockResolvedValueOnce(undefined)

    render(
      <Controls
        campaignName="Q4 Outreach"
        approved={true}
        isPaused={true}
        onSend={vi.fn()}
        onSchedule={vi.fn()}
        onResume={onResume}
      />
    )

    expect(screen.getByText(/PAUSED/)).toBeTruthy()
    expect(screen.getByText(/Campaign dispatch is disabled\./)).toBeTruthy()
    expect(screen.getByRole('button', { name: /send now/i }).disabled).toBe(
      true
    )
    expect(
      screen.getByRole('button', { name: /confirm schedule/i }).disabled
    ).toBe(true)

    const resumeBtn = screen.getByRole('button', { name: /resume campaign/i })
    expect(resumeBtn.disabled).toBe(false)

    fireEvent.click(resumeBtn)
    expect(screen.getByText(/resume this campaign/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /yes, confirm/i }))

    await waitFor(() => {
      expect(onResume).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Action completed successfully.')).toBeTruthy()
    })
  })

  it('enables scheduling for a valid future timestamp and submits ISO string on confirm', async () => {
    const onSchedule = vi.fn().mockResolvedValueOnce(undefined)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const pad = (n) => String(n).padStart(2, '0')
    const futureLocal = `${tomorrow.getFullYear()}-${pad(
      tomorrow.getMonth() + 1
    )}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(
      tomorrow.getMinutes()
    )}`

    render(
      <Controls
        campaignName="Q4 Outreach"
        approved={true}
        onSchedule={onSchedule}
      />
    )

    const scheduleBtn = screen.getByRole('button', {
      name: /confirm schedule/i,
    })
    expect(scheduleBtn.disabled).toBe(true)

    fireEvent.change(screen.getByLabelText(/dispatch date and time/i), {
      target: { value: futureLocal },
    })
    expect(scheduleBtn.disabled).toBe(false)

    fireEvent.click(scheduleBtn)
    expect(screen.getByText(/schedule this campaign/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /yes, confirm/i }))

    await waitFor(() => {
      expect(onSchedule).toHaveBeenCalledWith(
        new Date(futureLocal).toISOString()
      )
      expect(
        screen.getByText('Schedule request completed successfully.')
      ).toBeTruthy()
    })
  })
})
