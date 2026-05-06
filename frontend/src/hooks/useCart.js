import { useState, useCallback } from 'react';

const STORAGE_KEY = 'netravox_cart';

const loadCart = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

const saveCart = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export function useCart() {
  const [items, setItems] = useState(loadCart);

  const addToCart = useCallback((service) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.serviceId === service._id);
      const next = existing
        ? prev.map((i) => i.serviceId === service._id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { serviceId: service._id, name: service.name?.tr || service.name?.en || '', unitPrice: service.price || 0, currency: service.currency || 'TRY', quantity: 1 }];
      saveCart(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((serviceId) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.serviceId !== serviceId);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((serviceId, quantity) => {
    if (quantity < 1) return;
    setItems((prev) => {
      const next = prev.map((i) => i.serviceId === serviceId ? { ...i, quantity } : i);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return { items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems };
}
