import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import CatalogPagination from '../../components/CatalogPagination';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ total_orders: 0, buyers: 0, confirmed: 0, confirmed_revenue: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const response = await api.get('/shop/admin/orders', { params });
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
      setSummary(response.data.summary);
    } catch (error) { console.error('Error fetching admin orders:', error); } finally { setLoading(false); }
  }, [status, debouncedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 280);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const resetFilters = () => { setSearch(''); setDebouncedSearch(''); setStatus(''); };
  const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
  const formatDate = (value) => new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

  return <main className="admin-console fade-in"><div className="container">
    <header className="admin-console__hero"><div><p className="section-kicker">Operacion Turix</p><h1>Reservas, con nombre propio.</h1><p>Consulta quien compro, que experiencia eligio, el total confirmado y el responsable que creo el producto.</p></div><div className="admin-console__actions"><Link to="/admin" className="btn btn--secondary">Volver al inventario</Link><Link to="/admin/trips/new" className="btn btn--primary admin-console__create"><span>+</span> Nuevo registro</Link></div></header>
    <section className="admin-stats" aria-label="Resumen de reservas"><article><span>Ordenes</span><strong>{Number(summary.total_orders).toLocaleString('es-EC')}</strong><small>compras registradas</small></article><article><span>Confirmadas</span><strong>{Number(summary.confirmed).toLocaleString('es-EC')}</strong><small>reservas vigentes</small></article><article><span>Compradores</span><strong>{Number(summary.buyers).toLocaleString('es-EC')}</strong><small>usuarios unicos</small></article><article><span>Ingresos confirmados</span><strong>{formatCurrency(summary.confirmed_revenue)}</strong><small>total acumulado</small></article></section>
    <section className="admin-table-card"><div className="admin-table-card__top"><div><p className="section-kicker">Ventas</p><h2>Historial de reservas</h2></div><span>{pagination.total.toLocaleString('es-EC')} resultados</span></div>
      <div className="admin-toolbar"><label className="admin-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar comprador, correo, codigo u orden" aria-label="Buscar reserva" /></label><div className="admin-toolbar__filters"><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Estado de reserva"><option value="">Todos los estados</option><option value="confirmed">Confirmadas</option><option value="pending">Pendientes</option><option value="cancelled">Canceladas</option></select>{(search || status) && <button type="button" onClick={resetFilters}>Limpiar</button>}</div></div>
      {loading ? <div className="admin-loading"><div className="spinner__circle" /><span>Cargando reservas...</span></div> : orders.length === 0 ? <div className="admin-empty"><strong>Aun no hay reservas que mostrar.</strong><button className="btn btn--secondary btn--sm" type="button" onClick={resetFilters}>Limpiar filtros</button></div> : <div className="admin-table-scroll"><table className="admin-table admin-orders-table"><thead><tr><th>Orden</th><th>Comprador</th><th>Experiencias</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><code>#{order.id}</code></td><td><div className="admin-buyer"><strong>{order.buyer_name}</strong><span>{order.buyer_email}</span></div></td><td><div className="admin-order-items">{order.items.map((item) => <div key={item.trip_id}><strong>{item.trip_name}</strong><span>{item.trip_code} · {item.quantity} x {formatCurrency(item.unit_price)}{item.creator_name ? ` · Creado por ${item.creator_name}` : ''}</span></div>)}</div></td><td><span className="admin-date">{formatDate(order.created_at)}</span></td><td><span className={`status-badge ${order.status === 'confirmed' ? 'status-badge--active' : 'status-badge--inactive'}`}>{order.status === 'confirmed' ? 'Confirmada' : order.status === 'pending' ? 'Pendiente' : 'Cancelada'}</span></td><td><strong className="admin-order-total">{formatCurrency(order.total_amount)}</strong></td></tr>)}</tbody></table></div>}
      {!loading && pagination.pages > 1 && <CatalogPagination pagination={pagination} onPageChange={fetchOrders} disabled={loading} />}
    </section>
  </div></main>;
}

export default OrdersPage;
