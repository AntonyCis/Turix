import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { onServerChange } from '../api/client';

const nodes = ['node-1', 'node-2', 'node-3'];

function ServerBadge() {
  const [nodeId, setNodeId] = useState(null);
  const [counts, setCounts] = useState({ 'node-1': 0, 'node-2': 0, 'node-3': 0 });
  const [testing, setTesting] = useState(false);

  useEffect(() => onServerChange((nextNodeId) => {
    setNodeId(nextNodeId);
    setCounts((current) => ({ ...current, [nextNodeId]: (current[nextNodeId] || 0) + 1 }));
  }), []);

  useEffect(() => {
    const heartbeat = window.setInterval(() => api.get('/health').catch(() => {}), 4500);
    return () => window.clearInterval(heartbeat);
  }, []);

  const testDistribution = async () => {
    setTesting(true);
    for (let request = 0; request < 10; request += 1) {
      try { await api.get('/health'); } catch { break; }
    }
    setTesting(false);
  };

  return <AnimatePresence>{nodeId && <motion.div className="server-badge" initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}>
    <motion.span className="server-badge__dot" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
    <div className="server-badge__copy"><span>Balanceador activo</span><strong>Ultima respuesta: {nodeId}</strong></div>
    <div className="server-badge__nodes" aria-label="Peticiones atendidas por nodo">{nodes.map((node) => <span key={node} className={node === nodeId ? 'is-active' : ''} title={`${node}: ${counts[node]} respuestas`}>{node.replace('node-', '')}:<b>{counts[node]}</b></span>)}</div>
    <button type="button" className="server-badge__test" onClick={testDistribution} disabled={testing}>{testing ? 'Midiendo...' : 'Probar'}</button>
  </motion.div>}</AnimatePresence>;
}

export default ServerBadge;
