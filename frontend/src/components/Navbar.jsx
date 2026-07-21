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
      setHidden(currentY > lastScrollY.current && currentY > 100);
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
    <nav className={`navbar ${hidden ? 'navbar--hidden' : 'navbar--visible'}`} role="navigation" aria-label="Navegacion principal">
      <Link to="/" className="navbar__brand" aria-label="Turix - Inicio">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none"><path d="M16 3 27 16 16 29 5 16 16 3Z" stroke="currentColor" strokeWidth="1.7"/><path d="m20.5 11.5-3.15 7.05-7.05 3.15 3.15-7.05 7.05-3.15Z" fill="currentColor"/></svg>
        </span>
        <span>turix</span>
      </Link>

      <ul className="navbar__links">
        <li><Link to="/" className={`navbar__link ${location.pathname === '/' ? 'navbar__link--active' : ''}`}>Explorar</Link></li>
        {isAdmin && <li><Link to="/admin" className={`navbar__link ${location.pathname.startsWith('/admin') ? 'navbar__link--active' : ''}`}>Admin</Link></li>}
      </ul>

      <div className="navbar__actions">
        {isAuthenticated ? <>
          <Link to="/cart" className="navbar__cart-btn" aria-label={`Carrito (${totalItems} items)`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L20.3 8H6.1"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>
            {totalItems > 0 && <span className="navbar__cart-badge">{totalItems}</span>}
          </Link>
          <span className="navbar__user">{user?.full_name}</span>
          <button onClick={handleLogout} className="btn btn--ghost btn--sm">Salir</button>
        </> : <>
          <Link to="/login" className="btn btn--ghost btn--sm">Entrar</Link>
          <Link to="/register" className="btn btn--primary btn--sm">Crear cuenta <span aria-hidden="true">↗</span></Link>
        </>}
      </div>
    </nav>
  );
}

export default Navbar;
