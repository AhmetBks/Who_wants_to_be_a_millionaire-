import React from 'react';
import { useGameContext } from '@/context/GameContext';

interface PriceLadderProps {
  className?: string;
}

const PriceLadder: React.FC<PriceLadderProps> = ({ className = '' }) => {
  const { gameState } = useGameContext();
  const { moneyLadder, currentPrize } = gameState;

  return (
    <div className={`p-4 bg-gray-800 text-white rounded-lg self-start ${className}`}>
      <h3 className="text-center font-bold mb-3 text-yellow-400">Prize Ladder</h3>
      <ul className="space-y-2">
        {moneyLadder.map((prize, index) => {
          const isCurrentPrize = prize === currentPrize;
          
          return (
            <li 
              key={index} 
              className={`py-2 px-3 rounded text-center ${
                isCurrentPrize 
                  ? 'bg-yellow-600 font-bold' 
                  : index < moneyLadder.indexOf(currentPrize) 
                    ? 'text-gray-400' 
                    : ''
              }`}
            >
              {prize}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PriceLadder;