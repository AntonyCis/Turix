import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onServerChange } from '../api/client';

function ServerBadge() {
  const [nodeId, setNodeId] = useState(null);

  useEffect(() => {
    return onServerChange(setNodeId);
  }, []);

  return (
    <AnimatePresence>
      {nodeId && (
        <motion.div
          className="server-badge"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.5
          }}
        >
          <motion.span
            className="server-badge__dot"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          Respondió: {nodeId}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ServerBadge;