import React, { useEffect, useState, useRef } from 'react';
import { useGameContext } from '@/context/GameContext';
import OptionButton from './OptionButton';
import JokerButton from './JokerButton';
import PriceLadder from './PriceLadder';
import Alert from './Alert';

const Game: React.FC = () => {
  const { gameState, requestQuestion, retryConnection, isConnected, startGame } = useGameContext();
  const { currentQuestion, options, jokerInfo, message, messageType, reconnecting, allQuestions, moneyLadder, currentPrize, currentQuestionIndex } = gameState;
  const [isLoading, setIsLoading] = useState(true);
  const [gameStartInitiated, setGameStartInitiated] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'alert' | 'correct' | 'wrong' | 'joker' | 'win' | 'info'>('info');
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Force-exit loading state after a maximum time to prevent infinite loading
  useEffect(() => {
    // Set a hard timeout to exit loading state no matter what
    const hardTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Force exiting loading state after hard timeout');
        setIsLoading(false);
      }
    }, 8000); // 8 second hard timeout
    
    return () => clearTimeout(hardTimeout);
  }, [isLoading]);

  // When the component mounts or connection status changes
  useEffect(() => {
    console.log('Connection status changed:', isConnected);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Only try to start the game if we're connected and haven't already initiated game start
    if (isConnected && !gameStartInitiated) {
      console.log('Game mounted, starting game...');
      setGameStartInitiated(true);
      
      // Set loading state while we wait for the game to start
      setIsLoading(true);
      
      // Start game with a delay to ensure connection is stable
      setTimeout(() => {
        console.log('Sending startGame request to server...');
        startGame(); // Send startGame event to server
        
        // Add a longer timeout to exit loading state if we don't receive data
        // This prevents users from being stuck in loading state
        loadingTimeoutRef.current = setTimeout(() => {
          console.log('Loading timeout reached, forcing exit from loading state');
          setIsLoading(false);
        }, 8000); // Increased timeout to allow more time for server response
      }, 1000); // Increased delay before sending start request
    } else if (!isConnected) {
      // If we're not connected, keep the loading state
      setIsLoading(true);
    }
    
    // If we've got questions or a current question, we're no longer loading
    if (currentQuestion || (allQuestions && allQuestions.length > 0)) {
      console.log('Questions received, exiting loading state');
      setIsLoading(false);
    }
  }, [isConnected, currentQuestion, startGame, gameStartInitiated, allQuestions]);

  // Watch for message changes to detect game state changes and trigger alerts
  useEffect(() => {
    console.log('Message received:', message, 'Type:', messageType);
    
    // Show alerts for specific message types
    if (message && ['alert', 'correct', 'wrong', 'win', 'joker'].includes(messageType)) {
      setAlertMessage(message);
      setAlertType(messageType as 'alert' | 'correct' | 'wrong' | 'joker' | 'win');
      setShowAlert(true);
    }
    
    // Game started message or any message - turn off loading after a delay
    if (message) {
      if (message.includes('Game started!') || 
          message.includes('First question loaded') || 
          message.includes('Starting a new game')) {
        // Short delay to allow data to load
        setTimeout(() => {
          console.log('Game started message received, exiting loading state');
          setIsLoading(false);
        }, 2000); // Increased delay to ensure data has loaded
      }
      
      // If we get any message at all, make sure we eventually exit loading state
      const messageTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      
      return () => clearTimeout(messageTimeout);
    }
  }, [message, messageType]);

  // Additional useEffect to ensure we're not stuck in loading state
  useEffect(() => {
    const checkLoadingState = setTimeout(() => {
      if (isLoading && isConnected) {
        console.log('Still in loading state after delay, checking game state');
        
        // If we're connected but still loading, try to exit loading state
        if (currentQuestion || options.length > 0 || (allQuestions && allQuestions.length > 0)) {
          console.log('Game data detected, exiting loading state');
          setIsLoading(false);
        }
      }
    }, 3000);
    
    return () => clearTimeout(checkLoadingState);
  }, [isLoading, isConnected, currentQuestion, options, allQuestions]);

  // Generate message class based on type
  const getMessageClass = () => {
    switch (messageType) {
      case 'alert':
        return 'bg-red-100 text-red-700 p-3 rounded-lg';
      case 'correct':
        return 'bg-green-100 text-green-700 p-3 rounded-lg';
      case 'wrong':
        return 'bg-red-100 text-red-700 p-3 rounded-lg';
      case 'joker':
        return 'bg-purple-100 text-purple-700 p-3 rounded-lg';
      case 'win':
        return 'bg-yellow-100 text-yellow-700 p-3 rounded-lg font-bold';
      default:
        return 'bg-blue-100 text-blue-700 p-3 rounded-lg';
    }
  };

  // Check for connection loss message
  const isConnectionError = message && (
    message.includes('Connection to game server lost') || 
    message.includes('Unable to connect to game server') ||
    !isConnected
  ) ? true : false; // Explicitly convert to boolean

  // Handle alert close
  const handleAlertClose = () => {
    setShowAlert(false);
  };

  // Handle reconnect
  const handleReconnect = () => {
    retryConnection();
    setGameStartInitiated(false); // Reset game state to allow restart
  };

  // Debug function to show available data
  const showDebugInfo = () => {
    return (
      <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs font-mono overflow-auto max-h-32">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Current Question: {currentQuestion ? 'Yes' : 'No'}</p>
        <p>Options Count: {options ? options.length : 0}</p>
        <p>Joker Info: {jokerInfo || 'None'}</p>
        <p>All Questions: {allQuestions && allQuestions.length > 0 ? `${allQuestions.length} available` : 'None'}</p>
        <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
        <p>Current Prize: {currentPrize}</p>
        <p>Question Index: {currentQuestionIndex}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Game Start Initiated: {gameStartInitiated ? 'Yes' : 'No'}</p>
        <p>Message: {message || 'None'}</p>
        <p>Message Type: {messageType || 'None'}</p>
      </div>
    );
  };

  // Render loading spinner when loading
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-blue-800 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-700">Loading game data...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 text-gray-800">
      {/* Alert component */}
      <Alert 
        message={alertMessage}
        type={alertType}
        show={showAlert}
        onClose={handleAlertClose}
        showReconnect={isConnectionError}
        onReconnect={handleReconnect}
        reconnecting={reconnecting}
        autoHide={!isConnectionError}
      />
      
      {/* Only show non-alert messages in the regular message area if they are NOT related to game starting */}
      {message && messageType === 'info' && 
       !message.includes('Starting a new game') && 
       !message.includes('Game started!') && (
        <div className={getMessageClass()}>
          {message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {/* Money ladder - now using the standalone component */}
        <PriceLadder className="w-full md:w-1/4" />
        
        {/* Main game area */}
        <div className="w-full md:w-3/4 bg-white shadow-lg rounded-lg p-4">
          {/* Loading state */}
          {isLoading && (
            <LoadingSpinner />
          )}

          {/* Current Prize */}
          {!isLoading && currentQuestion && (
            <div className="mb-4 text-center">
              <span className="bg-yellow-100 text-yellow-800 font-bold py-1 px-3 rounded-full">
                Current Prize: {currentPrize}
              </span>
            </div>
          )}

          {/* Show loading indicator when there's no question but we're connected */}
          {!isLoading && !currentQuestion && isConnected && (
            <div className="my-6 text-center">
              <p className="text-gray-600">Waiting for question...</p>
            </div>
          )}

          {/* Question display */}
          {!isLoading && currentQuestion && (
            <div className="my-6 text-center">
              <h2 className="text-xl font-bold mb-4 text-black">{currentQuestion}</h2>
              
              {/* Options */}
              {options && options.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {options.map((option, index) => (
                    <OptionButton 
                      key={index} 
                      option={String.fromCharCode(65 + index)} 
                      text={option} 
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-6">Waiting for options...</p>
              )}
              
              {/* Jokers */}
              {jokerInfo && (
                <div className="flex justify-center gap-4 mt-8">
                  <JokerButton type="50-50" />
                  <JokerButton type="audience" />
                  <JokerButton type="skip" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Show debug information in development */}
      {process.env.NODE_ENV !== 'production' && showDebugInfo()}
    </div>
  );
};

export default Game;