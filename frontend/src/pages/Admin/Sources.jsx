/* eslint-disable react-refresh/only-export-components */
import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'

export const CANONICAL_SOURCES = [
  {
    id: 'internshala',
    name: 'Internshala',
    baseUrl: 'https://internshala.com',
    isEnabled: true,
    permittedUseNote: 'Public internship and fresher job listings',
    status: 'healthy',
  },
  {
    id: 'naukri',
    name: 'Naukri Freshers',
    baseUrl: 'https://www.naukri.com/fresher-jobs',
    isEnabled: true,
    permittedUseNote: 'Entry level 0-1 yr jobs',
    status: 'healthy',
  },
  {
    id: 'apna',
    name: 'Apna Jobs',
    baseUrl: 'https://apna.co',
    isEnabled: true,
    permittedUseNote: 'Entry level fresher listings',
    status: 'healthy',
  },
  {
    id: 'workindia',
    name: 'WorkIndia',
    baseUrl: 'https://www.workindia.in',
    isEnabled: true,
    permittedUseNote: 'Verified blue/grey and entry-level positions',
    status: 'healthy',
  },
  {
    id: 'shine',
    name: 'Shine Freshers',
    baseUrl: 'https://www.shine.com',
    isEnabled: false,
    permittedUseNote: 'Public directory pending review',
    status: 'healthy',
  },
  {
    id: 'hackathons',
    name: 'Devpost & Unstop',
    baseUrl: 'https://unstop.com',
    isEnabled: true,
    permittedUseNote: 'Student hackathon competitions',
    status: 'healthy',
  },
  {
    id: 'college_tpo',
    name: 'TPO Public Directories',
    baseUrl: 'https://colleges.example.edu',
    isEnabled: true,
    permittedUseNote: 'Official college placement contacts',
    status: 'healthy',
  },
  {
    id: 'startups',
    name: 'YCombinator Workatastartup',
    baseUrl: 'https://workatastartup.com',
    isEnabled: true,
    permittedUseNote: 'Early stage founder hiring',
    status: 'healthy',
  },
]

// Provisional provider credit budgets (500 / 500 inferred from global 1,000 credit monthly budget)
export const PROVISIONAL_PROVIDER_MONTHLY_BUDGETS = {
  contactout: '500',
  snov: '500',
}

// Daily outreach send limit default
export const PROVISIONAL_DAILY_SEND_LIMIT = '100'

// Consolidated provisional budget defaults
export const PROVISIONAL_BUDGET_DEFAULTS = {
  contactoutMonthly: PROVISIONAL_PROVIDER_MONTHLY_BUDGETS.contactout,
  snovMonthly: PROVISIONAL_PROVIDER_MONTHLY_BUDGETS.snov,
  dailySendLimit: PROVISIONAL_DAILY_SEND_LIMIT,
}

export const BUDGET_FIELD_LABELS = {
  contactoutMonthly: 'ContactOut Monthly Credit Budget',
  snovMonthly: 'Snov.io Monthly Credit Budget',
  dailySendLimit: 'Daily Outreach Send Limit',
}

export const BUDGET_FIELD_UNITS = {
  contactoutMonthly: 'credits',
  snovMonthly: 'credits',
  dailySendLimit: 'emails/day',
}

/* ----------------------------------------------------------------------------
 * In-File Mock API Layer (FE-31)
 *
 * NOTE: There are no scraper source or budget configuration endpoints in
 * contracts/openapi.yaml. Per architecture guidelines, we NEVER call invented
 * or fictitious backend endpoints.
 *
 * When VITE_USE_MOCKS !== 'false' (default dev/demo mode), state changes update
 * an in-memory session store mimicking frontend/src/api/enrichment.js.
 * All changes reset on page refresh.
 *
 * When VITE_USE_MOCKS === 'false', the UI operates in local contract mode and informs
 * the user that backend configuration endpoints are pending contract implementation.
 * ------------------------------------------------------------------------- */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

let mockSourcesStore = CANONICAL_SOURCES.map((s) => ({ ...s }))
let mockBudgetsStore = { ...PROVISIONAL_BUDGET_DEFAULTS }

export async function fetchSources() {
  if (USE_MOCKS) {
    return mockSourcesStore.map((s) => ({ ...s }))
  }
  // When USE_MOCKS is false, do not invent backend endpoints.
  // Return canonical seed sources and let UI indicate offline contract mode.
  return CANONICAL_SOURCES.map((s) => ({ ...s }))
}

export async function updateSourceToggle(sourceId, targetEnabled) {
  if (USE_MOCKS) {
    mockSourcesStore = mockSourcesStore.map((s) =>
      s.id === sourceId ? { ...s, isEnabled: targetEnabled } : s
    )
    const updated = mockSourcesStore.find((s) => s.id === sourceId)
    return { success: true, source: { ...updated } }
  }
  throw new Error('Backend configuration service unavailable: endpoints pending contract change request.')
}

export async function fetchBudgetSettings() {
  if (USE_MOCKS) {
    return { ...mockBudgetsStore }
  }
  return { ...PROVISIONAL_BUDGET_DEFAULTS }
}

export async function updateBudgetSettings(newBudgets) {
  if (USE_MOCKS) {
    mockBudgetsStore = { ...newBudgets }
    return { success: true, budgets: { ...mockBudgetsStore } }
  }
  throw new Error('Backend configuration service unavailable: endpoints pending contract change request.')
}

export function resetMockApiStores() {
  mockSourcesStore = CANONICAL_SOURCES.map((s) => ({ ...s }))
  mockBudgetsStore = { ...PROVISIONAL_BUDGET_DEFAULTS }
}

export function validateBudgetField(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'Value is required.'
  }

  const str = String(value).trim()

  if (str.startsWith('-')) {
    return 'Value cannot be negative.'
  }

  if (str.includes('.')) {
    return 'Please enter a valid whole number, e.g. 100.'
  }

  if (!/^\d+$/.test(str)) {
    return 'Please enter a valid whole number, e.g. 100.'
  }

  return null
}

export function validateBudgetForm(formValues) {
  const errors = {}
  for (const [field, value] of Object.entries(formValues)) {
    const error = validateBudgetField(value)
    if (error) {
      errors[field] = error
    }
  }
  return errors
}

export default function SourcesPage({ initialSources } = {}) {
  const [sources, setSources] = useState(initialSources || mockSourcesStore)
  const [statusFilter, setStatusFilter] = useState('all')
  const [committedBudgets, setCommittedBudgets] = useState(mockBudgetsStore)
  const [budgetForm, setBudgetForm] = useState(mockBudgetsStore)
  const [formErrors, setFormErrors] = useState({})
  const [activeModal, setActiveModal] = useState(null)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const [srcs, bgts] = await Promise.all([fetchSources(), fetchBudgetSettings()])
        if (isMounted) {
          if (!initialSources) {
            setSources(srcs)
          }
          setCommittedBudgets(bgts)
          setBudgetForm(bgts)
        }
      } catch (err) {
        if (isMounted) {
          setNotification({
            type: 'error',
            message: err?.message || 'Failed to load configuration data.',
          })
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [initialSources])

  const enabledCount = useMemo(
    () => sources.filter((s) => s.isEnabled).length,
    [sources]
  )

  const filteredSources = useMemo(() => {
    if (statusFilter === 'enabled') {
      return sources.filter((s) => s.isEnabled)
    }
    if (statusFilter === 'disabled') {
      return sources.filter((s) => !s.isEnabled)
    }
    return sources
  }, [sources, statusFilter])

  const changedBudgetFields = useMemo(() => {
    return Object.keys(committedBudgets).filter(
      (key) => String(budgetForm[key]).trim() !== String(committedBudgets[key]).trim()
    )
  }, [budgetForm, committedBudgets])

  const hasErrors = Object.keys(formErrors).length > 0

  function handleBudgetInputChange(field, rawValue) {
    const updatedForm = { ...budgetForm, [field]: rawValue }
    setBudgetForm(updatedForm)

    const error = validateBudgetField(rawValue)
    setFormErrors((prev) => {
      const next = { ...prev }
      if (error) {
        next[field] = error
      } else {
        delete next[field]
      }
      return next
    })
  }

  function handleRequestSourceToggle(source) {
    const targetEnabled = !source.isEnabled
    setActiveModal({
      type: 'source_toggle',
      source,
      targetEnabled,
      oldValue: source.isEnabled ? 'Enabled' : 'Disabled',
      newValue: targetEnabled ? 'Enabled' : 'Disabled',
    })
  }

  function handleConfirmSourceToggle() {
    if (!activeModal || activeModal.type !== 'source_toggle') return
    const { source: targetSource, targetEnabled } = activeModal

    setActiveModal(null)

    // Call in-file mock API layer asynchronously
    updateSourceToggle(targetSource.id, targetEnabled).catch((err) => {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to update scraper source status in API layer.',
      })
    })

    setSources((prev) =>
      prev.map((s) =>
        s.id === targetSource.id ? { ...s, isEnabled: targetEnabled } : s
      )
    )

    const newStatusText = targetEnabled ? 'enabled' : 'disabled'
    const unhealthyWarning =
      targetEnabled && (targetSource.status === 'disabled' || targetSource.status === 'quarantined')
        ? ` Note: Source has status "${targetSource.status}" and will not run until healthy.`
        : ''

    setNotification({
      type: 'success',
      message: `Scraper source "${targetSource.name}" has been ${newStatusText} (in-memory demo state).${unhealthyWarning}`,
    })
  }

  function handleRequestBudgetSave(e) {
    e.preventDefault()

    const errors = validateBudgetForm(budgetForm)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0 || changedBudgetFields.length === 0) {
      return
    }

    const snapshot = {
      contactoutMonthly: String(budgetForm.contactoutMonthly).trim(),
      snovMonthly: String(budgetForm.snovMonthly).trim(),
      dailySendLimit: String(budgetForm.dailySendLimit).trim(),
    }

    const changes = changedBudgetFields.map((field) => ({
      field,
      label: BUDGET_FIELD_LABELS[field] || field,
      unit: BUDGET_FIELD_UNITS[field] || '',
      oldValue: committedBudgets[field],
      newValue: snapshot[field],
    }))

    setActiveModal({
      type: 'budget_update',
      changes,
      snapshot,
    })
  }

  function handleConfirmBudgetSave() {
    if (!activeModal || activeModal.type !== 'budget_update' || !activeModal.snapshot) return

    const committed = activeModal.snapshot
    setActiveModal(null)

    // Call in-file mock API layer asynchronously
    updateBudgetSettings(committed).catch((err) => {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to update budget settings in API layer.',
      })
    })

    setCommittedBudgets(committed)
    setBudgetForm(committed)
    setFormErrors({})

    setNotification({
      type: 'success',
      message: 'Budget and send limit configuration updated (in-memory demo state).',
    })
  }

  function handleResetForm() {
    setBudgetForm(committedBudgets)
    setFormErrors({})
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
            Admin Source Registry &amp; Budget Configuration
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: 0 }}>
          Manage scraper source availability, monthly enrichment provider budgets, and daily outreach send limits.
        </p>
      </div>

      {!USE_MOCKS && (
        <div
          role="region"
          aria-label="Offline Contract Notice"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--color-text-main)',
          }}
        >
          <strong>Offline Contract Mode:</strong> Backend configuration endpoints are not defined in the OpenAPI contract. Running in offline fallback mode without inventing fictitious backend endpoints.
        </div>
      )}

      <div
        role="region"
        aria-label="Demo Mode Notice"
        style={{
          backgroundColor: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-main)' }}>
            Demo Mode Notice
          </span>
          <Badge variant="neutral">In-Memory State</Badge>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
          All changes update <strong>in-memory React state only</strong>. Changes reset on page refresh and are <strong>not saved to the backend</strong>.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-light)', margin: 0, lineHeight: 1.4 }}>
          Source health statuses reflect initial demo seed values, not a live background health check.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-light)', margin: 0, lineHeight: 1.4 }}>
          The 500/500 provider credit allocation is a provisional UI default inferred from the global monthly budget of 1,000 credits, not an officially defined provider allocation.
        </p>
      </div>

      {notification && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: notification.type === 'success' ? 'var(--color-score-high-bg)' : 'var(--color-score-low-bg, #fee2e2)',
            color: notification.type === 'success' ? 'var(--color-score-high)' : 'var(--color-score-low, #991b1b)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(21, 128, 61, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
            marginBottom: '24px',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: 600,
              fontSize: '14px',
              padding: '0 4px',
            }}
          >
            &times;
          </button>
        </div>
      )}

      <section
        aria-labelledby="scraper-registry-title"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 id="scraper-registry-title" style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Scraper Source Registry
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
              Control scraper sources for lead intelligence. Toggling opens an explicit confirmation dialog.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge variant="success">{enabledCount} Active</Badge>
            <Badge variant="neutral">{sources.length - enabledCount} Disabled</Badge>
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter scraper sources by status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
            Filter:
          </span>
          <div
            style={{
              display: 'inline-flex',
              padding: '2px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              gap: '2px',
            }}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'enabled', label: 'Enabled' },
              { id: 'disabled', label: 'Disabled' },
            ].map(({ id, label }) => {
              const isSelected = statusFilter === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatusFilter(id)}
                  aria-pressed={isSelected}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--color-text-main)',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Source</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Base URL</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status (Demo seed)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Permitted Use Note</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>Scraper State</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map((source) => (
                <tr
                  key={source.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: source.isEnabled ? 'transparent' : 'var(--color-bg-subtle)',
                    opacity: source.isEnabled ? 1 : 0.85,
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    <div>{source.name}</div>
                    <code style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{source.id}</code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <a
                      href={source.baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '13px' }}
                    >
                      {source.baseUrl}
                    </a>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={source.status === 'healthy' ? 'success' : 'warning'}>
                      {source.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    {source.permittedUseNote}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: source.isEnabled ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {source.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={source.isEnabled}
                        aria-label={`Toggle scraper for ${source.name}`}
                        onClick={() => handleRequestSourceToggle(source)}
                        style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '12px',
                          backgroundColor: source.isEnabled ? 'var(--color-success)' : 'var(--color-border)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          padding: '2px',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transform: source.isEnabled ? 'translateX(20px)' : 'translateX(0px)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-labelledby="budget-config-title"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 id="budget-config-title" style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
            Enrichment &amp; Outreach Budget Configuration
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Configure monthly credit budgets per enrichment provider and daily outreach send limits.
          </p>
        </div>

        <form onSubmit={handleRequestBudgetSave}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Input
                label="ContactOut Monthly Budget (Credits)"
                id="budget-contactout"
                name="contactoutMonthly"
                aria-label="ContactOut Monthly Budget (Credits)"
                value={budgetForm.contactoutMonthly}
                error={formErrors.contactoutMonthly}
                onChange={(e) => handleBudgetInputChange('contactoutMonthly', e.target.value)}
                placeholder="e.g. 500"
                aria-describedby="budget-contactout-desc"
              />
              <span id="budget-contactout-desc" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Current committed: <strong>{committedBudgets.contactoutMonthly}</strong> credits/month
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Input
                label="Snov.io Monthly Budget (Credits)"
                id="budget-snov"
                name="snovMonthly"
                aria-label="Snov.io Monthly Budget (Credits)"
                value={budgetForm.snovMonthly}
                error={formErrors.snovMonthly}
                onChange={(e) => handleBudgetInputChange('snovMonthly', e.target.value)}
                placeholder="e.g. 500"
                aria-describedby="budget-snov-desc"
              />
              <span id="budget-snov-desc" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Current committed: <strong>{committedBudgets.snovMonthly}</strong> credits/month
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Input
                label="Daily Outreach Send Limit (Emails/Day)"
                id="budget-daily-send"
                name="dailySendLimit"
                aria-label="Daily Outreach Send Limit (Emails/Day)"
                value={budgetForm.dailySendLimit}
                error={formErrors.dailySendLimit}
                onChange={(e) => handleBudgetInputChange('dailySendLimit', e.target.value)}
                placeholder="e.g. 100"
                aria-describedby="budget-daily-send-desc"
              />
              <span id="budget-daily-send-desc" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Current committed: <strong>{committedBudgets.dailySendLimit}</strong> emails/day
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            {changedBudgetFields.length > 0 && (
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginRight: 'auto' }}>
                {changedBudgetFields.length} field{changedBudgetFields.length > 1 ? 's' : ''} modified
              </span>
            )}

            <Button
              variant="secondary"
              type="button"
              onClick={handleResetForm}
              disabled={changedBudgetFields.length === 0}
            >
              Reset Form
            </Button>

            <Button
              variant="primary"
              type="submit"
              disabled={hasErrors || changedBudgetFields.length === 0}
            >
              Review &amp; Save Budget Changes
            </Button>
          </div>
        </form>
      </section>

      {activeModal && activeModal.type === 'source_toggle' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Confirm Scraper Source State Change"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-main)', margin: 0 }}>
              Are you sure you want to change the scraper state for <strong>{activeModal.source.name}</strong>?
            </p>

            {activeModal.targetEnabled &&
              (activeModal.source.status === 'disabled' || activeModal.source.status === 'quarantined') && (
                <div
                  role="alert"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fcd34d',
                    color: '#92400e',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span aria-hidden="true">⚠️</span>
                  <span>
                    <strong>Warning:</strong> Scraper source status is currently <code>{activeModal.source.status}</code> and will not run until healthy.
                  </span>
                </div>
              )}

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Field</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Old Value</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>New Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>Scraper Status</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }}>
                    <Badge variant={activeModal.oldValue === 'Enabled' ? 'success' : 'neutral'}>
                      {activeModal.oldValue}
                    </Badge>
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                    <Badge variant={activeModal.newValue === 'Enabled' ? 'success' : 'neutral'}>
                      {activeModal.newValue}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              <strong>Demo Notice:</strong> This action updates in-memory UI state only. It does not communicate with live scraper workers or backend databases.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button
                variant={activeModal.newValue === 'Disabled' ? 'danger' : 'primary'}
                onClick={handleConfirmSourceToggle}
              >
                Confirm {activeModal.newValue}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal && activeModal.type === 'budget_update' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Confirm Budget Configuration Changes"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-main)', margin: 0 }}>
              Review the modified budget parameters before applying changes to the in-memory session:
            </p>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Configuration Setting</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Old Value</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>New Value</th>
                </tr>
              </thead>
              <tbody>
                {activeModal.changes.map((change) => (
                  <tr key={change.field} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{change.label}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }}>
                      {change.oldValue} {change.unit}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {change.newValue} {change.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              <strong>Demo Notice:</strong> These updates apply to the current browser session in memory. They will reset on page refresh and are not saved to the backend.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmBudgetSave}>
                Confirm &amp; Apply Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
