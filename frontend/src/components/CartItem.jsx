function CartItem({ item, onUpdateQuantity, onRemove }) {
  const imageUrl = item.image_url || `https://picsum.photos/seed/${item.code}/200/150`;

  return (
    <div className="cart-item">
      <img src={imageUrl} alt={item.name} className="cart-item__image" loading="lazy" />
      <div className="cart-item__info">
        <h4 className="cart-item__name">{item.name}</h4>
        <p className="cart-item__code">Código: {item.code}</p>
        <div className="cart-item__actions">
          <div className="quantity-selector">
            <button
              className="quantity-selector__btn"
              onClick={() => onUpdateQuantity(item.trip_id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="quantity-selector__value">{item.quantity}</span>
            <button
              className="quantity-selector__btn"
              onClick={() => onUpdateQuantity(item.trip_id, item.quantity + 1)}
              disabled={item.quantity >= item.available_slots}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
          <span className="cart-item__price">
            ${(item.price * item.quantity).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
          </span>
          <button
            className="cart-item__remove"
            onClick={() => onRemove(item.trip_id)}
            aria-label={`Eliminar ${item.name} del carrito`}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;