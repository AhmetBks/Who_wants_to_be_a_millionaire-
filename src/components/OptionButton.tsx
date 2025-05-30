import React from 'react';
import { useGameContext } from '@/context/GameContext';

type OptionButtonProps = {
  option: string;
  text: string;
};

const OptionButton: React.FC<OptionButtonProps> = ({ option, text }) => {
  const { sendAnswer } = useGameContext();
  
  // Extract just the option letter (A, B, C, D) from text if needed
  const optionLetter = option.charAt(0);
  
  const handleClick = () => {
    sendAnswer(optionLetter);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-4 my-2 text-left rounded-lg bg-blue-100 hover:bg-blue-200 text-gray-900 transition-colors border-2 border-blue-300 font-semibold cursor-pointer shadow-sm hover:shadow-md"
    >
      {text}
    </button>
  );
};

export default OptionButton;