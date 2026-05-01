import { lazy, Suspense } from 'react'
import './App.css'
import { AppProvider } from './AppContext'
import { useAuthContext, useTrainerContext } from './context/appContextStore'
import { hasSupabaseCredentials } from './lib/supabase'

// Layout — always loaded (small, structural)
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'

// Auth — always loaded (first screen users see)
import { AuthScreen } from './components/auth/AuthScreen'
import { PasswordRecovery } from './components/auth/PasswordRecovery'

// Heavy views — lazy loaded (only fetched when navigated to)
const StudentPortal = lazy(() => import('./components/portal/StudentPortal').then(m => ({ default: m.StudentPortal })))
const DashboardView = lazy(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })))
const WorkoutView = lazy(() => import('./components/workout/WorkoutView').then(m => ({ default: m.WorkoutView })))
const StudentsView = lazy(() => import('./components/students/StudentsView').then(m => ({ default: m.StudentsView })))
const StudentDetail = lazy(() => import('./components/students/StudentDetail').then(m => ({ default: m.StudentDetail })))
const ScheduleView = lazy(() => import('./components/schedule/ScheduleView').then(m => ({ default: m.ScheduleView })))
const BillingView = lazy(() => import('./components/billing/BillingView').then(m => ({ default: m.BillingView })))
const CoachSettingsView = lazy(() => import('./components/settings/CoachSettingsView').then(m => ({ default: m.CoachSettingsView })))

function ViewFallback() {
  return (
    <section className="view-skeleton" aria-live="polite" aria-label="Carregando conteudo">
      <div className="view-skeleton-row" />
      <div className="view-skeleton-card" />
      <div className="view-skeleton-card" />
      <div className="view-skeleton-card short" />
    </section>
  )
}

function AppContent() {
  const { authReady, currentUser, passwordRecoveryMode } = useAuthContext()
  const { loading, appMode, studentPortal, activeMenu } = useTrainerContext()

  // Loading
  if (!authReady || loading) {
    return (
      <div className="auth-stage">
        <div className="auth-card">
          <section className="view-skeleton compact" aria-live="polite" aria-label="Carregando painel">
            <div className="view-skeleton-row" />
            <div className="view-skeleton-card short" />
          </section>
        </div>
      </div>
    )
  }

  // Password recovery
  if (hasSupabaseCredentials && passwordRecoveryMode) {
    return <PasswordRecovery />
  }

  // Auth required
  if (hasSupabaseCredentials && !currentUser) {
    return <AuthScreen />
  }

  // Student portal
  if (appMode === 'student' && studentPortal) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <StudentPortal />
      </Suspense>
    )
  }

  // Trainer dashboard
  const showingDashboard = activeMenu === 'Dashboard'
  const showingWorkouts = activeMenu === 'Treinos'
  const showingStudents = activeMenu === 'Alunos'
  const showingSchedule = activeMenu === 'Agenda'
  const showingFinance = activeMenu === 'Financeiro'
  const showingSettings = activeMenu === 'Configuracoes'

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <section className="workspace-shell">
        <Topbar />

        <main className="workspace-content">
          <Suspense fallback={<ViewFallback />}>
            {showingDashboard && <DashboardView />}

            {showingWorkouts && <WorkoutView />}

            {showingStudents && (
              <section className="content-stack">
                <StudentsView />
              </section>
            )}

            {showingStudents && <StudentDetail />}

            {showingSchedule && (
              <section className="content-stack">
                <ScheduleView />
              </section>
            )}

            {showingFinance && <BillingView key={currentUser?.id ?? 'anon'} />}

            {showingSettings && <CoachSettingsView />}
          </Suspense>
        </main>
      </section>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
