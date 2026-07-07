import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const letters = ['T', 'u', 'r', 'i', 'x'];

function Preloader({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 600);
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="preloader__content">
            <div className="preloader__logo">
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  className="preloader__letter"
                  initial={{ opacity: 0, y: 40, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.08,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            <motion.div
              className="preloader__bar"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            />
            <motion.p
              className="preloader__tagline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Descubre Ecuador
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Preloader;