import React, { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge, Table } from '../../components/ui/Badge'
import { ScoreBadge } from '../../components/score/ScoreBadge'
import { Spinner, EmptyState, ErrorBanner } from '../../components/feedback/Spinner'

export default function KitchenSinkPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>UI Component Kit Showcase (_Kitchen)</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Demonstration of all foundational UI components, states, and design tokens.</p>
      </div>

      {/* Buttons */}
      <section style={{ backgroundColor: 'var(--color-bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Buttons</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="primary" isLoading>Loading State</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
        </div>
      </section>

      {/* Form Controls */}
      <section style={{ backgroundColor: 'var(--color-bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Form Controls</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <Input label="Search Leads" placeholder="Search by title or company..." />
          <Input
            label="Email Input with Error"
            aria-label="Email Input with Error"
            defaultValue="invalid-email"
            error="Please enter a valid email address"
          />
          <Select
            label="Filter by Source"
            aria-label="Filter by Source"
            options={[
              { value: 'all', label: 'All Sources' },
              { value: 'internshala', label: 'Internshala' },
              { value: 'naukri', label: 'Naukri Freshers' },
              { value: 'unstop', label: 'Devpost & Unstop' }
            ]}
          />
        </div>
      </section>

      {/* Score Badges & Status Badges */}
      <section style={{ backgroundColor: 'var(--color-bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Badges & Data Quality Scores</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <Badge variant="info">Info Badge</Badge>
          <Badge variant="success">Success Badge</Badge>
          <Badge variant="warning">Warning Badge</Badge>
          <Badge variant="danger">Danger Badge</Badge>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ScoreBadge score={94} band="high" reasons={[{ code: 'OFFICIAL_COMPANY_SOURCE' }, { code: 'EMAIL_VERIFIED_DELIVERABLE' }]} />
          <ScoreBadge score={72} band="medium" reasons={[{ code: 'AGGREGATOR_SOURCE' }, { code: 'EMAIL_CATCH_ALL' }]} />
          <ScoreBadge score={48} band="low" reasons={[{ code: 'EMAIL_UNVERIFIED' }, { code: 'DATA_AGED' }]} />
          <ScoreBadge score={0} band="suppressed" reasons={[{ code: 'Recipient domain suppressed' }]} />
        </div>
      </section>

      {/* Table Component */}
      <section style={{ backgroundColor: 'var(--color-bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Responsive Table Component</h2>
        <Table headers={['ID', 'Company', 'Status', 'Score']}>
          <tr>
            <td style={{ padding: '12px 16px' }}>#1</td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>Acme Corp</td>
            <td style={{ padding: '12px 16px' }}><Badge variant="success">Verified</Badge></td>
            <td style={{ padding: '12px 16px' }}><ScoreBadge score={92} band="high" /></td>
          </tr>
        </Table>
      </section>

      {/* Feedback States */}
      <section style={{ backgroundColor: 'var(--color-bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Feedback States</h2>
        <ErrorBanner message="Failed to reach enrichment provider. Automatic retry scheduled." onRetry={() => alert('Retrying...')} />
        <div style={{ margin: '16px 0' }}>
          <Spinner size={32} />
        </div>
        <EmptyState title="No enrichment candidates found" message="All leads currently have verified recruiter contacts." />
      </section>

      {/* Modal Demo */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Sample Modal Dialog">
        <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          This modal traps keyboard focus and closes on pressing the Escape key or clicking outside.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm Action</Button>
        </div>
      </Modal>
    </div>
  )
}
