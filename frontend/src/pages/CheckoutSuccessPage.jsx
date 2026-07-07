import { useNavigate } from 'react-router-dom';

function CheckoutSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="page fade-in">
      <div className="container">
        <div className="checkout-success">
          <div className="checkout-success__icon">✓</div>
          <h1 className="checkout-success__title">¡Compra Exitosa!</h1>
          <p className="checkout-success__message">
            Tu reserva ha sido confirmada. Recibirás un email con los detalles de tu viaje.
          </p>
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/')}>
            Seguir Explorando
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSuccessPage;