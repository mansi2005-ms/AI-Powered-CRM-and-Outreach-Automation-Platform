import React, { useState } from 'react'
import styles from './History.module.css'

const PAGE_SIZE = 5

export default function History() {
  const [page, setPage] = useState(1)

  const historyData = [
    {
      id: 1,
      requester: 'requester 1',
      timestamp: '2026-10-30T10:30:00',
      provider: 'Apollo',
      outcome: 'Success',
      credits: 2,
      provenance: 'LinkedIn',
    },
  ]

  const sortedHistory = [...historyData].sort(
  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
)

  const totalPages = Math.max(
    1,
    Math.ceil(sortedHistory.length / PAGE_SIZE)
  )

  const paginatedData = sortedHistory.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <h1 className={styles.title}>Enrichment History</h1>

        <p className={styles.subtitle}>
          Audit history of previous enrichment lookups.
        </p>
      </div>

      {sortedHistory.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No enrichment history found</h3>
          <p>Past enrichment requests will appear here.</p>
        </div>
      ) : (
        <>
          <div
            className={styles.tableWrapper}
            tabIndex={0}
            role="region"
            aria-label="Enrichment history table"
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Timestamp</th>
                  <th>Provider</th>
                  <th>Outcome</th>
                  <th>Credits</th>
                  <th>Email Provenance</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.requester}</td>

                    <td>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>

                    <td>{item.provider}</td>

                    <td>
                      <span
                        className={
                          item.outcome === 'Success'
                            ? styles.successBadge
                            : styles.failedBadge
                        }
                      >
                        {item.outcome}
                      </span>
                    </td>

                    <td>{item.credits}</td>

                    <td>{item.provenance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span>
              Showing {paginatedData.length} record(s)
            </span>

            <div className={styles.paginationControls}>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}