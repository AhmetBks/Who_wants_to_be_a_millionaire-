import React from 'react';
import { useGameContext } from '@/context/GameContext';

type JokerButtonProps = {
  type: string; // "50-50", "audience", or "skip"
  disabled?: boolean;
};

const JokerButton: React.FC<JokerButtonProps> = ({ type, disabled = false }) => {
  const { useJoker, gameState } = useGameContext();
  const { jokerInfo } = gameState;

  // Determine if this joker is available based on jokerInfo
  const isJokerAvailable = () => {
    if (!jokerInfo) return false;
    
    if (type === "50-50" && jokerInfo.includes("50:50 (Y)")) {
      return true;
    }
    if (type === "audience" && jokerInfo.includes("Ask the Audience (S)")) {
      return true;
    }
    
    // Skip joker is always available
    if (type === "skip") {
      return true;
    }
    
    return false;
  };

  const getJokerCode = () => {
    switch (type) {
      case "50-50": return "Y";
      case "audience": return "S";
      case "skip": return "SKIP";
      default: return "";
    }
  };

  const getJokerLabel = () => {
    switch (type) {
      case "50-50": return "50:50";
      case "audience": return "Ask Audience";
      case "skip": return "Skip";
      default: return "";
    }
  };

  const handleClick = () => {
    useJoker(getJokerCode());
  };

  const isAvailable = isJokerAvailable();

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !isAvailable}
      className={`px-6 py-3 m-2 rounded-lg font-semibold transition-colors cursor-pointer shadow-sm hover:shadow-md ${
        disabled || !isAvailable
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
          : 'bg-amber-400 hover:bg-amber-500 text-gray-900'
      }`}
    >
      {getJokerLabel()}
    </button>
  );
};

export default JokerButton;