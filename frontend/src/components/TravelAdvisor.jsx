import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const prompts = ['Quiero aventura', 'Una escapada de playa', 'Tengo 3 días', 'Plan cultural'];
const categoryTerms = {
  aventura: ['aventura', 'adrenalina', 'rafting', 'canopy', 'extremo'],
  playa: ['playa', 'mar', 'surf', 'relajar', 'relax'],
  cultural: ['cultura', 'cultural', 'historia', 'histórico', 'arte'],
  ecoturismo: ['naturaleza', 'selva', 'eco', 'fauna', 'amazonia', 'amazonía'],
  gastronómico: ['comida', 'gastronomía', 'gastronomico', 'gastronómico', 'sabores']
};

function getRecommendations(trips, question) {
  const text = question.toLowerCase();
  const budget = text.match(/(?:\$|presupuesto\s*(?:de|hasta)?\s*)(\d{2,4})/i)?.[1];
  const days = text.match(/(\d+)\s*d[ií]a/)?.[1];
  return [...trips].map((trip) => {
    let score = 0;
    const category = (trip.category_name || '').toLowerCase();
    Object.entries(categoryTerms).forEach(([name, terms]) => { if (category.includes(name) && terms.some((term) => text.includes(term))) score += 7; });
    if (text.includes((trip.destination || '').toLowerCase().split(',')[0].toLowerCase())) score += 8;
    if (budget && Number(trip.price) <= Number(budget)) score += 4;
    if (days && Number(trip.duration_days) <= Number(days)) score += 3;
    return { ...trip, score };
  }).sort((a, b) => b.score - a.score || Number(a.price) - Number(b.price)).slice(0, 3);
}

function TravelAdvisor() {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'advisor', text: 'Hola, soy Nara. Cuéntame qué tipo de viaje buscas y te sugiero experiencias de Turix.' }]);
  const endRef = useRef(null);

  useEffect(() => {
    if (open && trips.length === 0 && !loading) {
      setLoading(true);
      api.get('/trips', { params: { limit: 12 } }).then((res) => setTrips(res.data.trips)).finally(() => setLoading(false));
    }
  }, [open, trips.length, loading]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const ask = (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    setMessages((current) => [...current, { role: 'user', text: cleanQuestion }]);
    setInput('');
    const picks = getRecommendations(trips, cleanQuestion);
    window.setTimeout(() => {
      const text = picks.length ? 'Estas opciones encajan mejor con lo que me cuentas. Puedes abrirlas para ver el itinerario completo.' : 'Estoy cargando las experiencias; prueba nuevamente en un instante.';
      setMessages((current) => [...current, { role: 'advisor', text, picks }]);
    }, 380);
  };

  return (
    <div className="travel-advisor">
      {open && <aside className="travel-advisor__panel" aria-label="Asesor virtual de viajes">
        <header><div><span>Asesor virtual</span><strong>Nara · Turix</strong></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar asesor">×</button></header>
        <div className="travel-advisor__messages">
          {messages.map((message, index) => <div className={`advisor-message advisor-message--${message.role}`} key={`${message.role}-${index}`}><p>{message.text}</p>{message.picks?.length > 0 && <div className="advisor-picks">{message.picks.map((trip) => <Link key={trip.id} to={`/trips/${trip.id}`} onClick={() => setOpen(false)}><span>{trip.category_icon} {trip.category_name}</span><strong>{trip.name}</strong><small>{trip.duration_days} días · Desde ${Number(trip.price).toLocaleString('es-EC')}</small></Link>)}</div>}</div>)}
          {loading && <div className="advisor-message advisor-message--advisor"><p>Estoy revisando el catálogo...</p></div>}
          <div ref={endRef} />
        </div>
        <div className="travel-advisor__prompts">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => ask(prompt)}>{prompt}</button>)}</div>
        <form onSubmit={(event) => { event.preventDefault(); ask(input); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ej.: naturaleza por menos de $300" aria-label="Pregunta al asesor" /><button type="submit" aria-label="Enviar pregunta">↑</button></form>
        <p className="travel-advisor__disclaimer">Recomendaciones automáticas basadas en el catálogo actual.</p>
      </aside>}
      <button type="button" className="travel-advisor__launcher" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Abrir asesor virtual"><span>✦</span><b>¿Te ayudamos a elegir?</b></button>
    </div>
  );
}

export default TravelAdvisor;
