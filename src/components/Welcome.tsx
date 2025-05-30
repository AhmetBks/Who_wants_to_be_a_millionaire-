import React from 'react';
import { useGameContext } from '@/context/GameContext';

interface WelcomeProps {
  onStartGame: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStartGame }) => {
  const { startGame } = useGameContext();
  
  const handleStartGame = () => {
    // Call the context's startGame function to notify the server
    startGame();
    
    // Then call the local onStartGame to update the UI
    onStartGame();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8">
      <h1 className="text-5xl font-bold text-yellow-400 mb-8 drop-shadow-lg">
        Who Wants to Be a Millionaire?
      </h1>
      
      <div className="bg-blue-800 bg-opacity-50 p-8 rounded-xl shadow-2xl max-w-2xl border-2 border-blue-300">
        <p className="text-2xl text-white mb-6">
          Test your knowledge and try to win the million-dollar prize!
        </p>
        
        <p className="text-lg text-blue-200 mb-8">
          Answer 5 increasingly difficult questions correctly to win. You can use lifelines to help you along the way.
        </p>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-yellow-300 mb-2">Lifelines:</h3>
          <ul className="text-white">
            <li className="mb-2">🔍 Ask the Audience (S) - See what the audience thinks</li>
            <li>✂️ 50:50 (Y) - Eliminate two wrong answers</li>
          </ul>
        </div>
        
        <button
          onClick={handleStartGame}
          className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold py-4 px-10 rounded-full text-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
          START GAME
        </button>
      </div>
    </div>
  );
};

export default Welcome;