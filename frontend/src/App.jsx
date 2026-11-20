import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import LoginPage from './pages/Login/index'
import LeadPipelinePage from './pages/LeadPipeline/index'
import EnrichmentQueuePage from './pages/EnrichmentQueue/index'
import KitchenSinkPage from './pages/_Kitchen/index'
import ApprovalPage from './pages/CampaignManager/Approval'
import History from './pages/EnrichmentQueue/History'
import SourcesPage from './pages/Admin/Sources'
import { can } from './utils/roles'

function PlaceholderPage({ title, description, roleRequirement }) {
  return (
    <div style={{ padding: '32px' }}>
      <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{title}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>{description}</p>
        {title?.includes('Campaign Manager') && (
          <div style={{ marginBottom: '16px' }}>
            <a href="/campaigns/approval" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: '#ffffff', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
              Open Campaign Approval Screen (FE-23) &rarr;
            </a>
          </div>
        )}
        {roleRequirement && (
          <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
            Requires role: <code>{roleRequirement}</code>
          </div>
        )}
      </div>
    </div>
  )
}

function MainLayout({ user, onLogout, children }) {
  const location = useLocation()
  if (location.pathname === '/login') {
    return children
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar userRole={user?.role || null} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Header user={user} onLogout={onLogout} />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user')
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('auth_user')
      }
    }
    setLoading(false)
  }, [])

  function handleLogout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setCurrentUser(null)
  }

  if (loading) return null

  return (
    <BrowserRouter>
      <MainLayout user={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route
            path="/login"
            element={
              currentUser ? (
                <Navigate to="/pipeline" replace />
              ) : (
                <LoginPage onLoginSuccess={(u) => setCurrentUser(u)} />
              )
            }
          />
          <Route
            path="/pipeline"
            element={
              currentUser ? (
                <LeadPipelinePage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/kitchen"
            element={<KitchenSinkPage />}
          />
          <Route
            path="/my-leads"
            element={
              currentUser ? (
                <PlaceholderPage
                  title="My Assigned Leads (FE-14)"
                  description="Review and manage fresher opportunities claimed by or assigned to you."
                  roleRequirement="researcher, admin"
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/enrichment"
            element={
              currentUser ? (
                <EnrichmentQueuePage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/enrichment/history"
            element={
              currentUser ? (
                <History />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/campaigns/approval"
            element={
              (currentUser || import.meta.env.DEV) ? (
                <ApprovalPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/campaigns"
            element={
              currentUser ? (
                <PlaceholderPage
                  title="Campaign Manager & AI Draft Review (FE-21, FE-22)"
                  description="Review audience qualification, inspect Gemini Flash drafts, and approve outreach."
                  roleRequirement="campaign_manager, admin"
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/suppression"
            element={
              currentUser ? (
                <PlaceholderPage
                  title="Suppression & Do-Not-Contact List (FE-26)"
                  description="Manage unsubscribed emails and opt-out domains to preserve sender reputation."
                  roleRequirement="campaign_manager, admin"
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/system-health"
            element={
              currentUser ? (
                <PlaceholderPage
                  title="System Health Dashboard (FE-27)"
                  description="Real-time monitoring of n8n queues, credit consumption, and scraper source health."
                  roleRequirement="developer, admin"
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/error-center"
            element={
              currentUser ? (
                <PlaceholderPage
                  title="Automation Error Center (FE-28)"
                  description="Inspect failures across workflows, review AI suggested root causes, and replay jobs."
                  roleRequirement="developer, admin"
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              currentUser ? (
                can(currentUser.role, 'manage_users') || can(currentUser.role, 'manage_sources_budgets') ? (
                  <div style={{ padding: '32px' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Admin Settings & Budgets (FE-30, FE-31)</h2>
                      <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>Configure users, role assignments, provider credit budgets, and scraper registry.</p>
                      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a href="/admin/sources" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: '#ffffff', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                          FE-31: Source Registry &amp; Budget Configuration &rarr;
                        </a>
                        <a href="/admin/users" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', backgroundColor: 'var(--color-bg-alt, #f1f5f9)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 500, fontSize: '13px', textDecoration: 'none' }}>
                          FE-30: User &amp; Role Management &rarr;
                        </a>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                        Requires role: <code>admin</code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Navigate to="/pipeline" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/sources"
            element={
              currentUser ? (
                can(currentUser.role, 'manage_sources_budgets') ? (
                  <SourcesPage />
                ) : (
                  <Navigate to="/pipeline" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/users"
            element={
              currentUser ? (
                can(currentUser.role, 'manage_users') ? (
                  <PlaceholderPage
                    title="Admin User Management (FE-30)"
                    description="Manage team member accounts, role assignments, and access status."
                    roleRequirement="admin"
                  />
                ) : (
                  <Navigate to="/pipeline" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/" element={<Navigate to="/pipeline" replace />} />
          <Route
            path="*"
            element={
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <h2>404 - Page Not Found</h2>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  The requested page does not exist.
                </p>
              </div>
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}
