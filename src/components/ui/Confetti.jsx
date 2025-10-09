import React, { useEffect, useRef } from 'react';

const Confetti = ({ trigger }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiPieces = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];

    // Create confetti pieces
    for (let i = 0; i < 150; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: -10,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5,
        gravity: Math.random() * 0.1 + 0.05,
        wind: Math.random() * 0.02 - 0.01
      });
    }

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confettiPieces.forEach((piece, index) => {
        // Update position
        piece.y += piece.speed;
        piece.x += piece.wind;
        piece.rotation += piece.rotationSpeed;
        piece.speed += piece.gravity;

        // Draw confetti piece
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();

        // Remove pieces that are off screen
        if (piece.y > canvas.height + 10) {
          confettiPieces.splice(index, 1);
        }
      });

      // Continue animation if there are still pieces
      if (confettiPieces.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animation complete, remove canvas
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [trigger]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
};

export default Confetti;
