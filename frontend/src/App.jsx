import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ServerBadge from './components/ServerBadge';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogPage from './pages/CatalogPage';
import TripDetailPage from './pages/TripDetailPage';
import CartPage from './pages/CartPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import DashboardPage from './pages/admin/DashboardPage';
import TripFormPage from './pages/admin/TripFormPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner">
        <div className="spinner__circle" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<CatalogPage />} />
      <Route path="/trips/:id" element={<TripDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/trips/new"
        element={
          <ProtectedRoute adminOnly>
            <TripFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/trips/:id/edit"
        element={
          <ProtectedRoute adminOnly>
            <TripFormPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <AppRoutes />
      </main>
      <ServerBadge />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;