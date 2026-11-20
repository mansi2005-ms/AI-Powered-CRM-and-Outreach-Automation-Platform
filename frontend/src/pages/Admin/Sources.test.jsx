/* @vitest-environment jsdom */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import SourcesPage, {
  CANONICAL_SOURCES,
  PROVISIONAL_PROVIDER_MONTHLY_BUDGETS,
  PROVISIONAL_DAILY_SEND_LIMIT,
  PROVISIONAL_BUDGET_DEFAULTS,
  fetchSources,
  updateSourceToggle,
  fetchBudgetSettings,
  updateBudgetSettings,
  resetMockApiStores,
  validateBudgetField,
  validateBudgetForm,
} from './Sources'

describe('FE-31: Admin Source Registry & Budget Configuration', () => {
  afterEach(() => {
    cleanup()
    resetMockApiStores()
  })

  describe('Validation Functions Unit Tests', () => {
    it('rejects empty or whitespace inputs', () => {
      expect(validateBudgetField('')).toBe('Value is required.')
      expect(validateBudgetField('   ')).toBe('Value is required.')
      expect(validateBudgetField(null)).toBe('Value is required.')
      expect(validateBudgetField(undefined)).toBe('Value is required.')
    })

    it('rejects negative numbers', () => {
      expect(validateBudgetField('-1')).toBe('Value cannot be negative.')
      expect(validateBudgetField('-500')).toBe('Value cannot be negative.')
    })

    it('rejects non-numeric characters', () => {
      expect(validateBudgetField('abc')).toBe('Please enter a valid whole number, e.g. 100.')
      expect(validateBudgetField('100a')).toBe('Please enter a valid whole number, e.g. 100.')
      expect(validateBudgetField('$50')).toBe('Please enter a valid whole number, e.g. 100.')
    })

    it('rejects decimal numbers (floats)', () => {
      expect(validateBudgetField('12.5')).toBe('Please enter a valid whole number, e.g. 100.')
      expect(validateBudgetField('0.5')).toBe('Please enter a valid whole number, e.g. 100.')
    })

    it('accepts valid non-negative integers including zero', () => {
      expect(validateBudgetField('0')).toBeNull()
      expect(validateBudgetField('1')).toBeNull()
      expect(validateBudgetField('500')).toBeNull()
      expect(validateBudgetField('1000')).toBeNull()
    })

    it('validates entire form object properly', () => {
      const validForm = {
        contactoutMonthly: '600',
        snovMonthly: '400',
        dailySendLimit: '150',
      }
      expect(validateBudgetForm(validForm)).toEqual({})

      const invalidForm = {
        contactoutMonthly: '-10',
        snovMonthly: 'abc',
        dailySendLimit: '10.5',
      }
      const errors = validateBudgetForm(invalidForm)
      expect(errors.contactoutMonthly).toBe('Value cannot be negative.')
      expect(errors.snovMonthly).toBe('Please enter a valid whole number, e.g. 100.')
      expect(errors.dailySendLimit).toBe('Please enter a valid whole number, e.g. 100.')
    })
  })

  describe('Page Rendering Baseline', () => {
    beforeEach(() => {
      render(<SourcesPage />)
    })

    it('renders the header without the FE-31 badge', () => {
      expect(screen.getByText('Admin Source Registry & Budget Configuration')).toBeTruthy()
      expect(screen.queryByText('FE-31')).toBeNull()
    })

    it('renders the explicit in-memory demo notice banner and seed status disclaimer', () => {
      expect(screen.getByRole('region', { name: /demo mode notice/i })).toBeTruthy()
      expect(screen.getByText(/All changes update/i)).toBeTruthy()
      expect(screen.getByText(/not saved to the backend/i)).toBeTruthy()
      expect(screen.getByText(/Source health statuses reflect initial demo seed values/i)).toBeTruthy()
    })

    it('renders all 8 canonical scraper sources from seed data', () => {
      expect(CANONICAL_SOURCES).toHaveLength(8)
      CANONICAL_SOURCES.forEach((source) => {
        expect(screen.getByText(source.name)).toBeTruthy()
        expect(screen.getByText(source.id)).toBeTruthy()
      })
      expect(screen.getByText('7 Active')).toBeTruthy()
      expect(screen.getByText('1 Disabled')).toBeTruthy()
    })

    it('renders default provisional budget inputs with clearly named constants', () => {
      expect(PROVISIONAL_PROVIDER_MONTHLY_BUDGETS.contactout).toBe('500')
      expect(PROVISIONAL_PROVIDER_MONTHLY_BUDGETS.snov).toBe('500')
      expect(PROVISIONAL_DAILY_SEND_LIMIT).toBe('100')
      expect(PROVISIONAL_BUDGET_DEFAULTS.contactoutMonthly).toBe('500')
      expect(PROVISIONAL_BUDGET_DEFAULTS.snovMonthly).toBe('500')
      expect(PROVISIONAL_BUDGET_DEFAULTS.dailySendLimit).toBe('100')

      const contactoutInput = screen.getByLabelText(/contactout monthly budget/i)
      const snovInput = screen.getByLabelText(/snov\.io monthly budget/i)
      const dailySendInput = screen.getByLabelText(/daily outreach send limit/i)

      expect(contactoutInput.value).toBe('500')
      expect(snovInput.value).toBe('500')
      expect(dailySendInput.value).toBe('100')
    })

    it('does not render an arbitrary Reset All to Defaults button', () => {
      expect(screen.queryByRole('button', { name: /reset all to defaults/i })).toBeNull()
    })

    it('has the save budget button disabled initially when no changes are made', () => {
      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      expect(saveButton.disabled).toBe(true)
    })
  })

  describe('Budget Form Inline Validation in Component', () => {
    beforeEach(() => {
      render(<SourcesPage />)
    })

    it('shows inline error and disables submit when negative value entered', () => {
      const contactoutInput = screen.getByLabelText(/contactout monthly budget/i)
      fireEvent.change(contactoutInput, { target: { value: '-25' } })

      expect(screen.getByText('Value cannot be negative.')).toBeTruthy()
      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      expect(saveButton.disabled).toBe(true)
    })

    it('shows inline error and disables submit when non-numeric value entered', () => {
      const snovInput = screen.getByLabelText(/snov\.io monthly budget/i)
      fireEvent.change(snovInput, { target: { value: 'invalid_text' } })

      expect(screen.getByText('Please enter a valid whole number, e.g. 100.')).toBeTruthy()
      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      expect(saveButton.disabled).toBe(true)
    })

    it('shows inline error and disables submit when decimal value entered', () => {
      const dailySendInput = screen.getByLabelText(/daily outreach send limit/i)
      fireEvent.change(dailySendInput, { target: { value: '99.5' } })

      expect(screen.getByText('Please enter a valid whole number, e.g. 100.')).toBeTruthy()
      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      expect(saveButton.disabled).toBe(true)
    })

    it('clears error and enables submit when valid number entered', () => {
      const contactoutInput = screen.getByLabelText(/contactout monthly budget/i)
      fireEvent.change(contactoutInput, { target: { value: '-10' } })
      expect(screen.getByText('Value cannot be negative.')).toBeTruthy()

      fireEvent.change(contactoutInput, { target: { value: '750' } })
      expect(screen.queryByText('Value cannot be negative.')).toBeNull()

      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      expect(saveButton.disabled).toBe(false)
    })
  })

  describe('Source Toggle Confirmation Workflow', () => {
    beforeEach(() => {
      render(<SourcesPage />)
    })

    it('opens confirmation modal with old and new values when toggle is clicked', () => {
      const internshalaSwitch = screen.getByLabelText('Toggle scraper for Internshala')
      expect(internshalaSwitch.getAttribute('aria-checked')).toBe('true')

      fireEvent.click(internshalaSwitch)

      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByText('Confirm Scraper Source State Change')).toBeTruthy()
      expect(screen.getByText('Old Value')).toBeTruthy()
      expect(screen.getByText('New Value')).toBeTruthy()
      expect(screen.getAllByText('Enabled').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Disabled').length).toBeGreaterThan(0)
    })

    it('preserves existing source state when confirmation is cancelled', () => {
      const internshalaSwitch = screen.getByLabelText('Toggle scraper for Internshala')
      fireEvent.click(internshalaSwitch)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(screen.queryByRole('dialog')).toBeNull()
      expect(internshalaSwitch.getAttribute('aria-checked')).toBe('true')
      expect(screen.getByText('7 Active')).toBeTruthy()
    })

    it('applies exact proposed boolean state upon confirmation', () => {
      const internshalaSwitch = screen.getByLabelText('Toggle scraper for Internshala')
      fireEvent.click(internshalaSwitch)

      const confirmButton = screen.getByRole('button', { name: /confirm disabled/i })
      fireEvent.click(confirmButton)

      expect(screen.queryByRole('dialog')).toBeNull()
      expect(internshalaSwitch.getAttribute('aria-checked')).toBe('false')
      expect(screen.getByText('6 Active')).toBeTruthy()
      expect(screen.getByText('2 Disabled')).toBeTruthy()
      expect(screen.getByText(/Scraper source "Internshala" has been disabled/i)).toBeTruthy()
    })

    it('displays warning note when enabling a source whose status is disabled or quarantined', () => {
      cleanup()
      const unhealthySources = [
        {
          id: 'quarantined_src',
          name: 'Quarantined Portal',
          baseUrl: 'https://quarantine.example.com',
          isEnabled: false,
          permittedUseNote: 'Under investigation',
          status: 'quarantined',
        },
      ]
      render(<SourcesPage initialSources={unhealthySources} />)

      const toggleSwitch = screen.getByLabelText('Toggle scraper for Quarantined Portal')
      fireEvent.click(toggleSwitch)

      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByRole('alert')).toBeTruthy()
      expect(screen.getByText(/will not run until healthy/i)).toBeTruthy()
      expect(screen.getByText(/status is currently/i)).toBeTruthy()

      const confirmBtn = screen.getByRole('button', { name: /confirm enabled/i })
      fireEvent.click(confirmBtn)
      expect(screen.getByText(/will not run until healthy/i)).toBeTruthy()
    })
  })

  describe('Consolidated Budget Changes Confirmation Workflow', () => {
    beforeEach(() => {
      render(<SourcesPage />)
    })

    it('opens consolidated modal showing diff table of modified fields', () => {
      const contactoutInput = screen.getByLabelText(/contactout monthly budget/i)
      const dailySendInput = screen.getByLabelText(/daily outreach send limit/i)

      fireEvent.change(contactoutInput, { target: { value: '800' } })
      fireEvent.change(dailySendInput, { target: { value: '150' } })

      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      fireEvent.click(saveButton)

      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByText('Confirm Budget Configuration Changes')).toBeTruthy()

      expect(screen.getByText('ContactOut Monthly Credit Budget')).toBeTruthy()
      expect(screen.getByText('500 credits')).toBeTruthy()
      expect(screen.getByText('800 credits')).toBeTruthy()

      expect(screen.getByText('Daily Outreach Send Limit')).toBeTruthy()
      expect(screen.getByText('100 emails/day')).toBeTruthy()
      expect(screen.getByText('150 emails/day')).toBeTruthy()

      expect(screen.queryByText('Snov.io Monthly Credit Budget')).toBeNull()
    })

    it('cancels budget change without applying to committed state', () => {
      const contactoutInput = screen.getByLabelText(/contactout monthly budget/i)
      fireEvent.change(contactoutInput, { target: { value: '900' } })

      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      fireEvent.click(saveButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(screen.queryByRole('dialog')).toBeNull()
      const desc = document.getElementById('budget-contactout-desc')
      expect(desc.textContent).toContain('500')
      expect(desc.textContent).not.toContain('900')
    })

    it('commits exact snapshot values upon confirmation', () => {
      const contactoutInput = screen.getByLabelText(/contactout monthly budget/i)
      fireEvent.change(contactoutInput, { target: { value: '950' } })

      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      fireEvent.click(saveButton)

      const confirmButton = screen.getByRole('button', { name: /confirm & apply changes/i })
      fireEvent.click(confirmButton)

      expect(screen.queryByRole('dialog')).toBeNull()
      expect(screen.getByText(/Budget and send limit configuration updated/i)).toBeTruthy()
      const desc = document.getElementById('budget-contactout-desc')
      expect(desc.textContent).toContain('950')
    })

    it('commits the exact snapshot shown in dialog even if form input changes afterward', () => {
      const contactoutInput = screen.getByLabelText(/contactout monthly budget/i)

      // 1. Change ContactOut budget from 500 to 950
      fireEvent.change(contactoutInput, { target: { value: '950' } })

      // 2. Click Review & Save and open the confirmation dialog
      const saveButton = screen.getByRole('button', { name: /review & save budget changes/i })
      fireEvent.click(saveButton)
      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByText('950 credits')).toBeTruthy()

      // 3. Change form's underlying value to 975 after dialog has opened
      fireEvent.change(contactoutInput, { target: { value: '975' } })

      // 4. Click Confirm & Apply Changes
      const confirmButton = screen.getByRole('button', { name: /confirm & apply changes/i })
      fireEvent.click(confirmButton)

      // 5. Verify that committed budget is still 950, not 975
      expect(screen.queryByRole('dialog')).toBeNull()
      const desc = document.getElementById('budget-contactout-desc')
      expect(desc.textContent).toContain('950')
      expect(desc.textContent).not.toContain('975')
    })

    it('resets form back to committed values on Reset Form click', () => {
      const contactoutInput = screen.getByLabelText(/contactout monthly budget/i)
      fireEvent.change(contactoutInput, { target: { value: '999' } })
      expect(contactoutInput.value).toBe('999')

      const resetFormButton = screen.getByRole('button', { name: /reset form/i })
      fireEvent.click(resetFormButton)

      expect(contactoutInput.value).toBe('500')
    })
  })

  describe('Source Status Filters', () => {
    beforeEach(() => {
      render(<SourcesPage />)
    })

    it('defaults to "All" filter showing all 8 sources', () => {
      const allFilterBtn = screen.getByRole('button', { name: 'All' })
      expect(allFilterBtn.getAttribute('aria-pressed')).toBe('true')
      CANONICAL_SOURCES.forEach((source) => {
        expect(screen.getByText(source.name)).toBeTruthy()
      })
    })

    it('filters to show only enabled sources when "Enabled" is clicked', () => {
      const enabledFilterBtn = screen.getByRole('button', { name: 'Enabled' })
      fireEvent.click(enabledFilterBtn)
      expect(enabledFilterBtn.getAttribute('aria-pressed')).toBe('true')

      // Enabled sources should be visible
      expect(screen.getByText('Internshala')).toBeTruthy()
      expect(screen.getByText('Naukri Freshers')).toBeTruthy()
      // Disabled source should not be visible in the table
      expect(screen.queryByText('Shine Freshers')).toBeNull()

      // Summary badges still show total counts (7 Active, 1 Disabled)
      expect(screen.getByText('7 Active')).toBeTruthy()
      expect(screen.getByText('1 Disabled')).toBeTruthy()
    })

    it('filters to show only disabled sources when "Disabled" is clicked', () => {
      const disabledFilterBtn = screen.getByRole('button', { name: 'Disabled' })
      fireEvent.click(disabledFilterBtn)
      expect(disabledFilterBtn.getAttribute('aria-pressed')).toBe('true')

      // Disabled source should be visible
      expect(screen.getByText('Shine Freshers')).toBeTruthy()
      // Enabled sources should not be visible in the table
      expect(screen.queryByText('Internshala')).toBeNull()
      expect(screen.queryByText('Naukri Freshers')).toBeNull()

      // Summary badges still show total counts
      expect(screen.getByText('7 Active')).toBeTruthy()
      expect(screen.getByText('1 Disabled')).toBeTruthy()
    })

    it('restores all sources when "All" is clicked after filtering', () => {
      const disabledFilterBtn = screen.getByRole('button', { name: 'Disabled' })
      fireEvent.click(disabledFilterBtn)
      expect(screen.queryByText('Internshala')).toBeNull()

      const allFilterBtn = screen.getByRole('button', { name: 'All' })
      fireEvent.click(allFilterBtn)
      expect(allFilterBtn.getAttribute('aria-pressed')).toBe('true')

      CANONICAL_SOURCES.forEach((source) => {
        expect(screen.getByText(source.name)).toBeTruthy()
      })
    })
  })

  describe('In-File Mock API Layer Unit Tests', () => {
    beforeEach(() => {
      resetMockApiStores()
    })

    it('fetches canonical sources and budget settings', async () => {
      const sources = await fetchSources()
      expect(sources).toHaveLength(8)
      const budgets = await fetchBudgetSettings()
      expect(budgets.contactoutMonthly).toBe('500')
      expect(budgets.snovMonthly).toBe('500')
      expect(budgets.dailySendLimit).toBe('100')
    })

    it('updates source toggle in memory store', async () => {
      const res = await updateSourceToggle('internshala', false)
      expect(res.success).toBe(true)
      expect(res.source.isEnabled).toBe(false)

      const updatedSources = await fetchSources()
      const internshala = updatedSources.find((s) => s.id === 'internshala')
      expect(internshala.isEnabled).toBe(false)
    })

    it('updates budget settings in memory store', async () => {
      const newSettings = {
        contactoutMonthly: '750',
        snovMonthly: '250',
        dailySendLimit: '120',
      }
      const res = await updateBudgetSettings(newSettings)
      expect(res.success).toBe(true)
      expect(res.budgets).toEqual(newSettings)

      const fetched = await fetchBudgetSettings()
      expect(fetched).toEqual(newSettings)
    })

    it('resets stores back to defaults with resetMockApiStores', async () => {
      await updateSourceToggle('internshala', false)
      await updateBudgetSettings({ contactoutMonthly: '999', snovMonthly: '999', dailySendLimit: '999' })
      resetMockApiStores()

      const sources = await fetchSources()
      const budgets = await fetchBudgetSettings()
      expect(sources.find((s) => s.id === 'internshala').isEnabled).toBe(true)
      expect(budgets.contactoutMonthly).toBe('500')
    })
  })
})
