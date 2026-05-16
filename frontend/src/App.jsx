import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage          from "./pages/LoginPage";
import ForgotPage         from "./pages/ForgotPage";
import RegisterPage       from "./pages/RegisterPage";
import MfaPage            from "./pages/MfaPage";
import DashboardPage      from "./pages/DashboardPage";
import CentreValidations  from "./pages/CentreValidations";
import DashboardDirection from "./pages/DashboardDirection";
import EspaceCooperative  from "./pages/EspaceCooperative";
import MagasinierCentral  from "./pages/MagasinierCentral";
import PreparationsExpeditions from "./pages/PreparationsExpeditions";
import ProfilUtilisateur  from "./pages/ProfilUtilisateur";
import TracabiliteRapports from "./pages/TracabiliteRapports";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/forgot"   element={<ForgotPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/mfa"      element={<MfaPage />} />

          {/* App routes */}
          <Route path="/app"         element={<DashboardPage />} />
          <Route path="/app/:module" element={<DashboardPage />} />

          {/* Dedicated pages */}
          <Route path="/validations"  element={<CentreValidations />} />
          <Route path="/direction"    element={<DashboardDirection />} />
          <Route path="/cooperative"  element={<EspaceCooperative />} />
          <Route path="/magasinier"   element={<MagasinierCentral />} />
          <Route path="/preparations" element={<PreparationsExpeditions />} />
          <Route path="/profil"       element={<ProfilUtilisateur />} />
          <Route path="/tracabilite"  element={<TracabiliteRapports />} />

          {/* Default: redirect root to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
