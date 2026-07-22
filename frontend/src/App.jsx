import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { TravelPlannerProvider } from './context/TravelPlannerContext';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import ServerBadge from './components/ServerBadge';
import TravelAdvisor from './components/TravelAdvisor';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogPage from './pages/CatalogPage';
import TripDetailPage from './pages/TripDetailPage';
import CartPage from './pages/CartPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
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
        path="/admin/orders"
        element={
          <ProtectedRoute adminOnly>
            <OrdersPage />
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

function SmoothScroll({ children }) {
  useEffect(() => {
    const canUseSmoothScroll = window.matchMedia(
      '(prefers-reduced-motion: no-preference) and (pointer: fine)'
    ).matches;

    if (!canUseSmoothScroll) return undefined;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1,
      syncTouch: false
    });

    let animationFrameId;
    function raf(time) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return children;
}

function AppContent() {
  const [ready, setReady] = useState(false);
  const handlePreloaderDone = useCallback(() => setReady(true), []);

  return (
    <SmoothScroll>
      <AnimatePresence mode="wait">
        {!ready && <Preloader onComplete={handlePreloaderDone} />}
      </AnimatePresence>

      {ready && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <AppRoutes />
          </main>
          <footer className="footer footer--premium">
            <span className="footer__brand">turix <i>◆</i></span>
            <span>Viajes que se sienten · Ecuador</span>
            <span>© {new Date().getFullYear()}</span>
          </footer>
          <ServerBadge />
          <TravelAdvisor />
        </div>
      )}
    </SmoothScroll>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <TravelPlannerProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TravelPlannerProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
