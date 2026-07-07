import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

function TripFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    destination: '',
    available_slots: 10,
    category_id: '',
    price: '',
    duration_days: 1,
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    api.get('/trips/categories').then((res) => setCategories(res.data.categories));
    if (isEditing) {
      api.get(`/trips/${id}`).then((res) => {
        const t = res.data.trip;
        setForm({
          code: t.code,
          name: t.name,
          description: t.description,
          destination: t.destination,
          available_slots: t.available_slots,
          category_id: t.category_id,
          price: t.price,
          duration_days: t.duration_days,
          image_url: t.image_url || '',
          is_active: t.is_active
        });
      });
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await api.put(`/trips/${id}`, form);
      } else {
        await api.post('/trips', form);
      }
      navigate('/admin');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Error al guardar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="container" style={{ maxWidth: '700px' }}>
        <h1 className="page__title">{isEditing ? 'Editar Viaje' : 'Nuevo Viaje'}</h1>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="code">Código</label>
              <input id="code" name="code" className="form-input" placeholder="GAL-002" value={form.code} onChange={handleChange} required maxLength={20} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="category_id">Categoría</label>
              <select id="category_id" name="category_id" className="form-select" value={form.category_id} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Nombre del Destino</label>
            <input id="name" name="name" className="form-input" placeholder="Expedición Galápagos Premium" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Descripción</label>
            <textarea id="description" name="description" className="form-textarea" value={form.description} onChange={handleChange} required rows={4} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="destination">Destino / Ubicación</label>
            <input id="destination" name="destination" className="form-input" placeholder="Islas Galápagos, Ecuador" value={form.destination} onChange={handleChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="price">Precio ($)</label>
              <input id="price" name="price" type="number" step="0.01" className="form-input" value={form.price} onChange={handleChange} required min="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="available_slots">Cupos</label>
              <input id="available_slots" name="available_slots" type="number" className="form-input" value={form.available_slots} onChange={handleChange} required min="0" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="duration_days">Días</label>
              <input id="duration_days" name="duration_days" type="number" className="form-input" value={form.duration_days} onChange={handleChange} required min="1" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="image_url">URL de Imagen (opcional)</label>
            <input id="image_url" name="image_url" className="form-input" placeholder="https://ejemplo.com/imagen.jpg" value={form.image_url} onChange={handleChange} />
          </div>

          {isEditing && (
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input id="is_active" name="is_active" type="checkbox" checked={form.is_active} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="is_active" className="form-label" style={{ textTransform: 'none', marginBottom: 0 }}>Activo</label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Viaje'}
            </button>
            <button type="button" className="btn btn--secondary btn--lg" onClick={() => navigate('/admin')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TripFormPage;