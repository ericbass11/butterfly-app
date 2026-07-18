import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProgramProvider } from '@/context/ProgramContext'
import { AppLayout } from '@/components/AppLayout'
import { RequireAuth, RequireOnboarded, RequireRole } from '@/components/Guards'
import { Login } from '@/screens/Login'
import { Onboarding } from '@/screens/Onboarding'
import { Dashboard } from '@/screens/Dashboard'
import { Members } from '@/screens/Members'
import { Chat } from '@/screens/Chat'
import { Profile } from '@/screens/Profile'
import { PartnerDashboard } from '@/screens/PartnerDashboard'
import { AdminDashboard } from '@/screens/AdminDashboard'

export default function App() {
  return (
    <AuthProvider>
      <ProgramProvider>
        <HashRouter>
          <Routes>
            {/* Público */}
            <Route path="/" element={<Login />} />

            {/* Onboarding / Anamnese (autenticado) */}
            <Route
              path="/onboarding"
              element={
                <RequireAuth>
                  <Onboarding />
                </RequireAuth>
              }
            />

            {/* App autenticado + onboarding concluído */}
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <RequireOnboarded>
                    <AppLayout />
                  </RequireOnboarded>
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="educacao" element={<Members />} />
              <Route path="chat" element={<Chat />} />
              <Route path="perfil" element={<Profile />} />
              <Route
                path="parceiro"
                element={
                  <RequireRole role="partner">
                    <PartnerDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="admin"
                element={
                  <RequireRole role="admin">
                    <AdminDashboard />
                  </RequireRole>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ProgramProvider>
    </AuthProvider>
  )
}
