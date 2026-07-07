import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const direction = currentY > lastScrollY.current ? 'down' : 'up';
      const pastThreshold = currentY > 80;

      if (direction === 'down' && pastThreshold) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={`navbar ${hidden ? 'navbar--hidden' : 'navbar--visible'}`}
      role="navigation"
      aria-label="Navegación principal"
    >
      <Link to="/" className="navbar__brand" aria-label="Turix - Inicio">
        <span>✈️</span> <span>Turix</span>
      </Link>

      <ul className="navbar__links">
        <li>
          <Link
            to="/"
            className={`navbar__link ${location.pathname === '/' ? 'navbar__link--active' : ''}`}
          >
            Catálogo
          </Link>
        </li>
        {isAdmin && (
          <li>
            <Link
              to="/admin"
              className={`navbar__link ${location.pathname.startsWith('/admin') ? 'navbar__link--active' : ''}`}
            >
              Admin
            </Link>
          </li>
        )}
      </ul>

      <div className="navbar__actions">
        {isAuthenticated ? (
          <>
            <Link to="/cart" className="navbar__cart-btn" aria-label={`Carrito (${totalItems} items)`}>
              🛒
              {totalItems > 0 && <span className="navbar__cart-badge">{totalItems}</span>}
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {user?.full_name}
            </span>
            <button onClick={handleLogout} className="btn btn--ghost btn--sm">
              Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn--ghost btn--sm">
              Entrar
            </Link>
            <Link to="/register" className="btn btn--primary btn--sm">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;