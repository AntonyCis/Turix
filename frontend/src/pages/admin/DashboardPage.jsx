import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

function DashboardPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips', { params: { active: 'all', limit: 100 } });
      setTrips(res.data.trips);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este viaje?')) return;
    try {
      await api.delete(`/trips/${id}`);
      setTrips(trips.map((t) => (t.id === id ? { ...t, is_active: false } : t)));
    } catch (err) {
      console.error('Error deleting trip:', err);
    }
  };

  return (
    <div className="page fade-in">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1 className="page__title">Panel de Administración</h1>
            <p className="page__subtitle">Gestiona los paquetes de viaje</p>
          </div>
          <Link to="/admin/trips/new" className="btn btn--primary">
            + Nuevo Viaje
          </Link>
        </div>

        {loading ? (
          <div className="spinner"><div className="spinner__circle" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Destino</th>
                <th>Precio</th>
                <th>Cupos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td style={{ fontFamily: 'monospace' }}>{trip.code}</td>
                  <td>{trip.name}</td>
                  <td>{trip.destination}</td>
                  <td>${parseFloat(trip.price).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                  <td>{trip.available_slots}</td>
                  <td>
                    <span className={`status-badge ${trip.is_active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                      {trip.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/admin/trips/${trip.id}/edit`} className="btn btn--secondary btn--sm">
                        Editar
                      </Link>
                      {trip.is_active && (
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleDelete(trip.id)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;