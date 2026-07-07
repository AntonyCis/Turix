import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback((trip, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.trip_id === trip.id);
      if (existing) {
        return prev.map(item =>
          item.trip_id === trip.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        trip_id: trip.id,
        code: trip.code,
        name: trip.name,
        price: parseFloat(trip.price),
        image_url: trip.image_url,
        destination: trip.destination,
        available_slots: trip.available_slots,
        quantity
      }];
    });
  }, []);

  const removeItem = useCallback((tripId) => {
    setItems(prev => prev.filter(item => item.trip_id !== tripId));
  }, []);

  const updateQuantity = useCallback((tripId, quantity) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item =>
      item.trip_id === tripId ? { ...item, quantity } : item
    ));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
