import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

const ConfettiPiece = ({ id, x, y, angle, speed, rotation, color }) => {
  const [position, setPosition] = useState({ x, y, opacity: 1 });

  useEffect(() => {
    const animation = () => {
      setPosition(prev => {
        const newY = prev.y + speed;
        if (newY > window.innerHeight) {
          return { ...prev, opacity: 0 };
        }
        return { ...prev, y: newY };
      });
    };
    const frameId = requestAnimationFrame(animation);
    return () => cancelAnimationFrame(frameId);
  }, [speed]);

  const style = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    backgroundColor: color,
    width: '8px',
    height: '16px',
    transform: `rotate(${rotation}deg)`,
    opacity: position.opacity,
    transition: 'opacity 0.5s ease-out',
    zIndex: 9999,
  };

  return <div style={style}></div>;
};

const Confetti = ({ active, duration = 5000 }) => {
  const [pieces, setPieces] = useState([]);

  const colors = useMemo(() => ['#E94B29', '#F4C145', '#1B1B1B', '#34D399'], []);

  useEffect(() => {
    if (active) {
      const newPieces = Array.from({ length: 150 }).map((_, i) => ({
        id: i + Date.now(),
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 200,
        angle: Math.random() * 360,
        speed: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, colors]);

  if (!active || pieces.length === 0) {
    return null;
  }

  return ReactDOM.createPortal(
    <div>
      {pieces.map(piece => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </div>,
    document.body
  );
};

export default Confetti;