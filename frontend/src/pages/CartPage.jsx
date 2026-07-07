import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartItem from '../components/CartItem';
import api from '../api/client';
import { useState } from 'react';

function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const checkoutItems = items.map((item) => ({
        trip_id: item.trip_id,
        quantity: item.quantity
      }));
      await api.post('/shop/checkout', { items: checkoutItems });
      clearCart();
      navigate('/checkout/success');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Error al procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page fade-in">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state__icon">🛒</div>
            <p className="empty-state__text">Tu carrito está vacío</p>
            <p className="empty-state__subtext">Explora nuestros destinos y agrega viajes</p>
            <button className="btn btn--primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
              Ver Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <div className="container">
        <h1 className="page__title">Carrito de Compras</h1>
        <div className="cart-layout">
          <div>
            {items.map((item) => (
              <CartItem
                key={item.trip_id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
          <div className="cart-summary">
            <h3 className="cart-summary__title">Resumen</h3>
            <div className="cart-summary__row">
              <span>Ítems ({totalItems})</span>
              <span>${totalAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="cart-summary__row">
              <span>Impuestos</span>
              <span>Incluidos</span>
            </div>
            <div className="cart-summary__total">
              <span>Total</span>
              <span>${totalAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
            </div>
            {error && <div className="alert alert--error" style={{ marginTop: '1rem' }}>{error}</div>}
            <button
              className="btn btn--primary btn--full btn--lg"
              style={{ marginTop: '1rem' }}
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar Compra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;