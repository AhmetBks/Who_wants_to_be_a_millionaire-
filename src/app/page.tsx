'use client';

import React, { useState } from 'react';
import { GameProvider } from '../context/GameContext';
import Game from '../components/Game';
import Welcome from '../components/Welcome';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white py-8">
      <div className="container mx-auto">
        <GameProvider>
          {gameStarted ? (
            <Game />
          ) : (
            <Welcome onStartGame={handleStartGame} />
          )}
        </GameProvider>
      </div>
    </div>
  );
}
