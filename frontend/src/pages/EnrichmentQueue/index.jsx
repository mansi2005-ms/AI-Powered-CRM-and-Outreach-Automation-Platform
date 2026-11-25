import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Spinner, EmptyState, ErrorBanner } from '../../components/feedback/Spinner'
import { can } from '../../utils/roles'
import {
  DEFAULT_PROVIDER,
  MISSING_FIELD_LABELS,
  PROVIDERS,
  enrichLeads,
  estimateCredits,
  getCreditBudget,
  getEnrichmentQueue,
  providerLabel,
} from '../../api/enrichment'

/**
 * Enrichment Queue page (FE-16).
 *
 * Shows leads that still need verified contact details. The researcher ticks
 * rows, picks a provider per row, presses "Enrich Contact", confirms the credit
 * cost in a modal (FE-17 will replace the inline <ConfirmDialog> below with its
 * own EnrichConfirmModal.jsx), and the backend does the lookup.
 *
 * All requests go through ../../api/enrichment.js -> our backend. Never to
 * ContactOut / Snov.io directly.
 */

const PAGE_CSS = `
.eq-scroll {
  width: 100%; max-width: 100%; overflow-x: auto;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}
.eq-table { width: 100%; min-width: 900px; border-collapse: collapse; text-align: left; font-size: 14px; }
.eq-table thead { background: var(--color-bg-subtle); border-bottom: 1px solid var(--color-border); }
.eq-th { padding: 12px 16px; font-weight: 600; color: var(--color-text-main); white-space: nowrap; }
.eq-th-check, .eq-td-check { width: 44px; padding: 12px 8px 12px 16px; }
.eq-row { border-bottom: 1px solid var(--color-border); }
.eq-row:last-child { border-bottom: none; }
.eq-row:hover { background: var(--color-bg-subtle); }
.eq-row[data-selected="true"] { background: var(--color-primary-light); }
.eq-td { padding: 12px 16px; vertical-align: middle; }
.eq-check { width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-primary); }
.eq-select {
  height: 34px; padding: 0 8px; border: 1px solid var(--color-border);
  border-radius: var(--radius-md); background: var(--color-bg-surface);
  color: var(--color-text-main); font-size: 13px;
}
.eq-select:focus-visible, .eq-check:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.eq-toolbar {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 16px; background: var(--color-bg-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
}
.eq-toolbar-left { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; font-size: 14px; }
.eq-muted { color: var(--color-text-muted); }
.eq-flags { display: flex; flex-wrap: wrap; gap: 4px; }
.eq-summary { width: 100%; border-collapse: collapse; font-size: 14px; }
.eq-summary td { padding: 8px 0; border-bottom: 1px solid var(--color-border); }
.eq-summary td:last-child { text-align: right; font-weight: 600; }
.eq-summary tr:last-child td { border-bottom: none; }
`

/* ----------------------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------------------- */

function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function creditsText(n) {
  return `${n} credit${n === 1 ? '' : 's'}`
}

const OUTCOME_BADGES = {
  enriched: { variant: 'success', label: 'Enriched – left the queue' },
  needs_research: { variant: 'warning', label: 'Needs research' },
}

/* ----------------------------------------------------------------------------
 * Credit confirmation dialog.
 * Inline for now. FE-17 (EnrichConfirmModal.jsx) can replace this component
 * and keep the same props.
 * ------------------------------------------------------------------------- */

function ConfirmDialog({ isOpen, onClose, running, progress, items, budget, budgetError, onRetryBudget, onConfirm }) {
  const totalCost = items.reduce((sum, item) => sum + item.cost, 0)

  // how many records go to each provider
  const byProvider = PROVIDERS.map((p) => {
    const rows = items.filter((item) => item.provider === p.value)
    return { ...p, count: rows.length, cost: rows.reduce((sum, item) => sum + item.cost, 0) }
  }).filter((p) => p.count > 0)

  const dailyLeft = budget ? Math.max(0, budget.dailyBudget - budget.dailyUsed) : null
  const monthlyLeft = budget ? Math.max(0, budget.monthlyBudget - budget.monthlyUsed) : null
  const overDaily = budget ? totalCost > dailyLeft : false
  const overMonthly = budget ? totalCost > monthlyLeft : false
  const blocked = overDaily || overMonthly

  const canConfirm = !running && !!budget && !blocked && items.length > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={running ? () => {} : onClose}
      title="Confirm enrichment & credit usage"
    >
      <table className="eq-summary">
        <tbody>
          <tr>
            <td>Records selected</td>
            <td>{items.length}</td>
          </tr>
          {byProvider.map((p) => (
            <tr key={p.value}>
              <td>
                {p.label} <span className="eq-muted">({p.count} record{p.count === 1 ? '' : 's'})</span>
              </td>
              <td>{creditsText(p.cost)}</td>
            </tr>
          ))}
          <tr>
            <td>Total estimated cost</td>
            <td>{creditsText(totalCost)}</td>
          </tr>
          <tr>
            <td>Remaining daily budget</td>
            <td>{budget ? `${dailyLeft} of ${budget.dailyBudget}` : '…'}</td>
          </tr>
          <tr>
            <td>Remaining monthly budget</td>
            <td>{budget ? `${monthlyLeft} of ${budget.monthlyBudget}` : '…'}</td>
          </tr>
        </tbody>
      </table>

      {budgetError && (
        <div style={{ marginTop: '16px' }}>
          <ErrorBanner message={`Could not load your credit budget: ${budgetError}`} onRetry={onRetryBudget} />
        </div>
      )}

      {blocked && (
        <div
          role="alert"
          style={{
            marginTop: '16px', padding: '12px 16px', fontSize: '14px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-score-low)',
            backgroundColor: 'var(--color-score-low-bg)', color: 'var(--color-score-low)',
          }}
        >
          This would use more credits than you have left{overDaily ? ' today' : ' this month'}. Deselect some
          records or choose the cheaper provider.
        </div>
      )}

      <p className="eq-muted" style={{ fontSize: '12px', marginTop: '16px' }}>
        The cost is an estimate. The backend deducts the credits you confirm here, one lookup at a time.
      </p>

      {running && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }} aria-live="polite">
          <Spinner size={20} />
          <span style={{ fontSize: '14px' }}>
            Enriching {progress.done} of {progress.total}…
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
        <Button variant="secondary" onClick={onClose} disabled={running}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={!canConfirm} isLoading={running}>
          Confirm & Deduct Credits
        </Button>
      </div>
    </Modal>
  )
}

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export default function EnrichmentQueuePage({ currentUser }) {
  const allowed = can(currentUser?.role, 'enrich_contact')

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selected, setSelected] = useState(() => new Set())
  const [providers, setProviders] = useState({}) // leadId -> provider (default ContactOut)
  const [rowErrors, setRowErrors] = useState({}) // leadId -> message
  const [processed, setProcessed] = useState([]) // finished this session

  const [phase, setPhase] = useState('idle') // idle | confirm | running
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [budget, setBudget] = useState(null)
  const [budgetError, setBudgetError] = useState(null)
  const [notice, setNotice] = useState(null)

  const headerCheckRef = useRef(null)

  /* ---- load the queue ---- */

  const load = useCallback(async (isCancelled = () => false) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getEnrichmentQueue()
      if (isCancelled()) return
      setRows(result.items)
      setTotal(result.total)
      setSelected(new Set())
      setRowErrors({})
    } catch (err) {
      if (isCancelled()) return
      setError(err?.message || 'Failed to load the enrichment queue')
    } finally {
      if (!isCancelled()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    load(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [load])

  /* ---- derived values ---- */

  const providerFor = useCallback((id) => providers[id] || DEFAULT_PROVIDER, [providers])

  const selectedItems = useMemo(
    () =>
      rows
        .filter((row) => selected.has(row.id))
        .map((row) => {
          const provider = providerFor(row.id)
          return { leadId: row.id, provider, cost: estimateCredits(provider) }
        }),
    [rows, selected, providerFor]
  )
  const selectedCost = selectedItems.reduce((sum, item) => sum + item.cost, 0)

  const allSelected = rows.length > 0 && selectedItems.length === rows.length
  const someSelected = selectedItems.length > 0 && !allSelected

  useEffect(() => {
    if (headerCheckRef.current) headerCheckRef.current.indeterminate = someSelected
  }, [someSelected])

  /* ---- selection ---- */

  function toggleRow(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))
  }

  function setProviderFor(id, value) {
    setProviders((prev) => ({ ...prev, [id]: value }))
  }

  function setProviderForSelected(value) {
    if (!value) return
    setProviders((prev) => {
      const next = { ...prev }
      selected.forEach((id) => {
        next[id] = value
      })
      return next
    })
  }

  /* ---- enrichment flow ---- */

  function loadBudget() {
    setBudget(null)
    setBudgetError(null)
    getCreditBudget()
      .then(setBudget)
      .catch((err) => setBudgetError(err?.message || 'Unknown error'))
  }

  function openConfirm() {
    if (selectedItems.length === 0) return // button is disabled anyway
    setNotice(null)
    setPhase('confirm')
    loadBudget()
  }

  function closeConfirm() {
    if (phase !== 'running') setPhase('idle')
  }

  async function handleConfirm() {
    const items = selectedItems
    setPhase('running')
    setProgress({ done: 0, total: items.length })

    const results = await enrichLeads(
      items.map(({ leadId, provider }) => ({ leadId, provider })),
      { onProgress: (done, totalCount) => setProgress({ done, total: totalCount }) }
    )

    const byId = new Map(rows.map((row) => [row.id, row]))
    const leftQueue = results.filter((r) => r.status === 'enriched' || r.status === 'needs_research')
    const failed = results.filter((r) => r.status === 'failed' || r.status === 'skipped')
    const leftIds = new Set(leftQueue.map((r) => r.leadId))

    // Done leads leave the queue (enriched) or are parked as "needs research".
    setRows((prev) => prev.filter((row) => !leftIds.has(row.id)))
    setTotal((t) => Math.max(0, t - leftIds.size))
    setSelected((prev) => new Set([...prev].filter((id) => !leftIds.has(id))))
    setProcessed((prev) => [
      ...leftQueue.map((r) => ({
        id: r.leadId,
        organization_name: byId.get(r.leadId)?.organization_name || r.leadId,
        provider: r.provider,
        status: r.status,
        creditsUsed: r.creditsUsed,
      })),
      ...prev,
    ])
    setRowErrors(Object.fromEntries(failed.map((r) => [r.leadId, r.error])))

    const enrichedCount = results.filter((r) => r.status === 'enriched').length
    const researchCount = results.filter((r) => r.status === 'needs_research').length
    const creditsUsed = results.reduce((sum, r) => sum + (r.creditsUsed || 0), 0)
    const parts = []
    if (enrichedCount) parts.push(`${enrichedCount} enriched`)
    if (researchCount) parts.push(`${researchCount} marked needs research`)
    if (failed.length) parts.push(`${failed.length} not completed`)
    setNotice({
      kind: failed.length ? 'error' : 'success',
      message: `${parts.join(', ')}. ${creditsText(creditsUsed)} used.`,
    })

    setPhase('idle')
  }

  /* ---- render ---- */

  if (!allowed) {
    return (
      <div style={{ padding: '24px' }}>
        <EmptyState
          title="You do not have access to this page"
          message="The Enrichment Queue is available to researchers and admins."
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, maxWidth: '100%' }}>
      <style>{PAGE_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Contact Enrichment Queue</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Leads with an organization but no verified contact details. Every lookup uses credits and needs your
            confirmation first.
          </p>
        </div>
        <Button variant="secondary" onClick={() => load()} disabled={loading || phase === 'running'}>
          ↻ Refresh
        </Button>
      </div>

      {notice && (
        notice.kind === 'error' ? (
          <ErrorBanner message={notice.message} />
        ) : (
          <div
            role="status"
            style={{
              padding: '12px 16px', fontSize: '14px', fontWeight: 500,
              borderRadius: 'var(--radius-md)', border: '1px solid var(--color-score-high)',
              backgroundColor: 'var(--color-score-high-bg)', color: 'var(--color-score-high)',
            }}
          >
            {notice.message}
          </div>
        )
      )}

      {error && <ErrorBanner message={error} onRetry={() => load()} />}

      {/* Toolbar: selection info + the main action */}
      <div className="eq-toolbar">
        <div className="eq-toolbar-left">
          <strong>{selectedItems.length} selected</strong>
          <span className="eq-muted">Estimated cost: {creditsText(selectedCost)}</span>
          <label className="eq-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            Set provider for selected
            <select
              className="eq-select"
              value=""
              disabled={selectedItems.length === 0}
              onChange={(e) => setProviderForSelected(e.target.value)}
              aria-label="Set provider for all selected rows"
            >
              <option value="">Choose…</option>
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button onClick={openConfirm} disabled={selectedItems.length === 0 || phase !== 'idle'}>
          Enrich Contact{selectedItems.length > 0 ? ` (${selectedItems.length})` : ''}
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Spinner size={32} />
        </div>
      ) : rows.length === 0 && !error ? (
        <EmptyState
          title="The enrichment queue is empty"
          message="Every lead already has contact details, or has been sent for research."
        />
      ) : (
        <div className="eq-scroll" role="region" aria-label="Enrichment queue table (scrollable)" tabIndex={0}>
          <table className="eq-table" aria-busy={loading}>
            <thead>
              <tr>
                <th className="eq-th eq-th-check" scope="col">
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    className="eq-check"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
                <th className="eq-th" scope="col">Contact Name</th>
                <th className="eq-th" scope="col">Organization</th>
                <th className="eq-th" scope="col">Missing Fields</th>
                <th className="eq-th" scope="col">Provider</th>
                <th className="eq-th" scope="col">Estimated Credit Cost</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.55 : 1, transition: 'opacity 0.15s ease' }}>
              {rows.map((row) => {
                const isSelected = selected.has(row.id)
                const provider = providerFor(row.id)
                return (
                  <tr key={row.id} className="eq-row" data-selected={isSelected}>
                    <td className="eq-td eq-td-check">
                      <input
                        type="checkbox"
                        className="eq-check"
                        checked={isSelected}
                        onChange={() => toggleRow(row.id)}
                        aria-label={`Select ${row.organization_name}`}
                      />
                    </td>
                    <td className="eq-td">
                      {row.contact_name ? (
                        <span style={{ fontWeight: 600 }}>{row.contact_name}</span>
                      ) : (
                        <span className="eq-muted">Not identified yet</span>
                      )}
                      {rowErrors[row.id] && (
                        <div role="alert" style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '2px' }}>
                          {rowErrors[row.id]}
                        </div>
                      )}
                    </td>
                    <td className="eq-td">
                      <div style={{ fontWeight: 500 }}>{row.organization_name}</div>
                      {row.title && (
                        <div className="eq-muted" style={{ fontSize: '12px' }}>
                          {row.title} · found {formatDate(row.discovered_at)}
                        </div>
                      )}
                    </td>
                    <td className="eq-td">
                      <div className="eq-flags">
                        {row.missing_fields.length === 0 ? (
                          <span className="eq-muted">—</span>
                        ) : (
                          row.missing_fields.map((field) => (
                            <Badge key={field} variant="warning">
                              {MISSING_FIELD_LABELS[field] || field}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="eq-td">
                      <select
                        className="eq-select"
                        value={provider}
                        onChange={(e) => setProviderFor(row.id, e.target.value)}
                        aria-label={`Provider for ${row.organization_name}`}
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="eq-td" style={{ whiteSpace: 'nowrap' }}>
                      {creditsText(estimateCredits(provider))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="eq-muted" style={{ fontSize: '13px' }} aria-live="polite">
          Showing {rows.length} of {total} leads waiting for enrichment
        </div>
      )}

      {/* What happened to leads that were processed in this session */}
      {processed.length > 0 && (
        <section aria-label="Processed this session">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Processed this session</h2>
          <div className="eq-scroll">
            <table className="eq-table" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th className="eq-th" scope="col">Organization</th>
                  <th className="eq-th" scope="col">Provider</th>
                  <th className="eq-th" scope="col">Result</th>
                  <th className="eq-th" scope="col">Credits used</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((item) => {
                  const badge = OUTCOME_BADGES[item.status]
                  return (
                    <tr key={item.id} className="eq-row">
                      <td className="eq-td" style={{ fontWeight: 500 }}>{item.organization_name}</td>
                      <td className="eq-td">{providerLabel(item.provider)}</td>
                      <td className="eq-td">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="eq-td">{item.creditsUsed}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmDialog
        isOpen={phase === 'confirm' || phase === 'running'}
        onClose={closeConfirm}
        running={phase === 'running'}
        progress={progress}
        items={selectedItems}
        budget={budget}
        budgetError={budgetError}
        onRetryBudget={loadBudget}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
