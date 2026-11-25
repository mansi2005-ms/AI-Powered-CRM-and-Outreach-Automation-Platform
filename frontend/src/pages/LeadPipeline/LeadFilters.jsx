
import React, { useEffect, useState } from 'react'
import { Input, Select } from '../../components/ui/Input'
import {
    createDefaultFilters,
    readFiltersFromUrl,
    writeFiltersToUrl
} from '../../store/filters'

const SCORE_OPTIONS = [
    { value: 'all', label: 'All Score Bands' },
    { value: 'high', label: 'High (80+)' },
    { value: 'medium', label: 'Medium (60–79)' },
    { value: 'low', label: 'Low (<60)' },
    { value: 'suppressed', label: 'Suppressed' }
]

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'verified', label: 'Verified' },
    { value: 'draft_ready', label: 'Draft Ready' },
    { value: 'needs_enrichment', label: 'Needs Enrichment' },
    { value: 'approved', label: 'Approved' },
    { value: 'closed', label: 'Closed' }
]

export function LeadFilters({
    leads = [],
    filters: parentFilters,
    onFiltersChange,
    onSearchChange,
    onClear
}) {
    const [localFilters, setLocalFilters] = useState(() => readFiltersFromUrl())
    const filters = parentFilters ?? localFilters
    const setFilters = onFiltersChange ?? setLocalFilters
    const [searchInput, setSearchInput] = useState(filters.search)

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setFilters((current) => {
                const next = { ...current, search: searchInput }
                writeFiltersToUrl(next)
                onSearchChange?.(next.search)
                return next
            })
        }, 300)

        return () => window.clearTimeout(timer)
    }, [searchInput, onSearchChange, setFilters])

    useEffect(() => {
        writeFiltersToUrl(filters)
    }, [filters])

    useEffect(() => {
        const restoreFromUrl = () => {
            const restored = readFiltersFromUrl()
            setFilters(restored)
            setSearchInput(restored.search)
            onSearchChange?.(restored.search)
        }

        window.addEventListener('popstate', restoreFromUrl)
        return () => window.removeEventListener('popstate', restoreFromUrl)
    }, [onFiltersChange, onSearchChange, setFilters])

    const APPROVED_SOURCES = [
        'Internshala',
        'Naukri Freshers',
        'Devpost & Unstop',
        'College TPO Directories',
        'YC Workatastartup',
        'Apna Jobs',
        'WorkIndia'
    ]
    const extractedSources = [...new Set(leads.map((lead) => lead.source_name).filter(Boolean))]
    const sources = extractedSources.length > 0 ? extractedSources : APPROVED_SOURCES
    const assignees = [...new Set(leads.map((lead) => lead.assigned_to).filter(Boolean))]

    function updateFilter(name, value) {
        setFilters((current) => ({ ...current, [name]: value }))
    }

    function toggleSource(source) {
        setFilters((current) => ({
            ...current,
            sources: current.sources.includes(source)
                ? current.sources.filter((item) => item !== source)
                : [...current.sources, source]
        }))
    }
    function clearFilters() {
        const defaults = createDefaultFilters()
        setSearchInput('')

        if (onClear) {
            onClear()
        } else {
            setFilters(defaults)
            onSearchChange?.('')
            writeFiltersToUrl(defaults)
        }
    }

    return (
        <section
            aria-label="Lead filters"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: 'var(--color-bg-surface)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
            }}
        >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                    <Input
                        label="Search leads"
                        placeholder="Search company or job title..."
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                </div>

                <div style={{ flex: '1 1 180px' }}>
                    <Select
                        label="Score band"
                        aria-label="Score band"
                        value={filters.scoreBand}
                        onChange={(event) => updateFilter('scoreBand', event.target.value)}
                        options={SCORE_OPTIONS}
                    />
                </div>

                <div style={{ flex: '1 1 180px' }}>
                    <Select
                        label="Contact status"
                        aria-label="Contact status"
                        value={filters.status}
                        onChange={(event) => updateFilter('status', event.target.value)}
                        options={STATUS_OPTIONS}
                    />
                </div>

                <div style={{ flex: '1 1 180px' }}>
                    <Select
                        label="Assigned user"
                        aria-label="Assigned user"
                        value={filters.assignedTo}
                        onChange={(event) => updateFilter('assignedTo', event.target.value)}
                        options={[
                            { value: 'all', label: 'All assignments' },
                            { value: 'unassigned', label: 'Unassigned' },
                            ...assignees.map((user) => ({
                                value: String(user),
                                label: String(user)
                            }))
                        ]}
                    />
                </div>
            </div>

            <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                    Source
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {sources.map((source) => (
                        <label key={source} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px' }}>
                            <input
                                type="checkbox"
                                checked={filters.sources.includes(source)}
                                onChange={() => toggleSource(source)}
                            />
                            {source}
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                    Experience range (years): {filters.experienceMin}–{filters.experienceMax}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <label style={{ flex: '1 1 140px', fontSize: '13px' }}>
                        Minimum
                        <input
                            aria-label="Minimum experience"
                            type="range"
                            min="0"
                            max="10"
                            value={filters.experienceMin}
                            onChange={(event) =>
                                updateFilter(
                                    'experienceMin',
                                    Math.min(Number(event.target.value), filters.experienceMax)
                                )
                            }
                            style={{ display: 'block', width: '100%' }}
                        />
                    </label>

                    <label style={{ flex: '1 1 140px', fontSize: '13px' }}>
                        Maximum
                        <input
                            aria-label="Maximum experience"
                            type="range"
                            min="0"
                            max="10"
                            value={filters.experienceMax}
                            onChange={(event) =>
                                updateFilter(
                                    'experienceMax',
                                    Math.max(Number(event.target.value), filters.experienceMin)
                                )
                            }
                            style={{ display: 'block', width: '100%' }}
                        />
                    </label>
                </div>
            </div>

            <div>
                <button type="button" onClick={clearFilters}>
                    Clear All Filters
                </button>
            </div>
        </section>
    )
}
