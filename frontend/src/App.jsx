import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PagesListPage from './pages/PagesListPage';
import PageEditorPage from './pages/PageEditorPage';
import MediaPage from './pages/MediaPage';
import RestaurantMenuPage from './pages/RestaurantMenuPage';
import ReservationsPage from './pages/ReservationsPage';
import SeoPage from './pages/SeoPage';
import CompaniesPage from './pages/CompaniesPage';
import UsersPage from './pages/UsersPage';
import MenusPage from './pages/MenusPage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import FormsPage from './pages/FormsPage';
import LanguagesPage from './pages/LanguagesPage';
import RedirectsPage from './pages/RedirectsPage';
import RolesPage from './pages/RolesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import DentalServicesPage from './pages/DentalServicesPage';
import PropertiesManagePage from './pages/PropertiesManagePage';
import BlogListPage from './pages/BlogListPage';
import BlogEditorPage from './pages/BlogEditorPage';
import FaqManagePage from './pages/FaqManagePage';
import BlogCategoriesPage from './pages/BlogCategoriesPage';
import TestimonialsPage from './pages/TestimonialsPage';
import TeamPage from './pages/TeamPage';
import PopupsPage from './pages/PopupsPage';
import AuditLogPage from './pages/AuditLogPage';

import PanelLayout from './components/layout/PanelLayout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.isSuperAdmin ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <PanelLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pages" element={<PagesListPage />} />
          <Route path="pages/new" element={<PageEditorPage />} />
          <Route path="pages/:id/edit" element={<PageEditorPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="restaurant/menu" element={<RestaurantMenuPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="forms" element={<FormsPage />} />
          <Route path="seo" element={<SeoPage />} />
          <Route path="redirects" element={<RedirectsPage />} />
          <Route path="menus" element={<MenusPage />} />
          <Route path="languages" element={<LanguagesPage />} />
          <Route path="settings" element={<CompanySettingsPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<SuperAdminRoute><RolesPage /></SuperAdminRoute>} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="dental/services" element={<DentalServicesPage />} />
          <Route path="services" element={<DentalServicesPage />} />
          <Route path="real-estate/properties" element={<PropertiesManagePage />} />
          <Route path="blog" element={<BlogListPage />} />
          <Route path="blog/new" element={<BlogEditorPage />} />
          <Route path="blog/:id/edit" element={<BlogEditorPage />} />
          <Route path="faqs" element={<FaqManagePage />} />
          <Route path="blog-categories" element={<BlogCategoriesPage />} />
          <Route path="testimonials" element={<TestimonialsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="popups" element={<PopupsPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold mb-4" style={{ color: 'var(--text-muted)' }}>404</p>
      <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Sayfa bulunamadı</p>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <a href="/dashboard" className="text-sm text-blue-600 hover:underline">Dashboard'a dön</a>
    </div>
  );
}
