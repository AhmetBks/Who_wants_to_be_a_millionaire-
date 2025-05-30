import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, forceReconnect } from '@/utils/socket';

// Define money ladder
const moneyLadder = [
  "$1,000,000", 
  "$500,000",
  "$250,000",
  "$100,000", 
  "$50,000",
  "$10,000", 
  "$1,000", 
  "$500", 
  "$100"
];

// Define types for our game state
interface GameContextType {
  socket: Socket | null;
  gameState: {
    currentQuestion: string;
    options: string[];
    jokerInfo: string;
    message: string;
    messageType: string;
    allQuestions: any[]; // Array to store all questions
    currentQuestionIndex: number;
    reconnecting: boolean;
    moneyLadder: string[];
    currentPrize: string;
  };
  isConnected: boolean;
  sendAnswer: (answer: string) => void;
  useJoker: (joker: string) => void;
  requestQuestion: () => void;
  startGame: () => void;
  goToQuestion: (index: number) => void;
  retryConnection: () => void;
}

// Create the context with a default value
const GameContext = createContext<GameContextType>({
  socket: null,
  gameState: {
    currentQuestion: '',
    options: [],
    jokerInfo: '',
    message: 'Connecting to game server...',
    messageType: 'info',
    allQuestions: [],
    currentQuestionIndex: 0,
    reconnecting: false,
    moneyLadder: moneyLadder,
    currentPrize: moneyLadder[moneyLadder.length - 1]
  },
  isConnected: false,
  sendAnswer: () => {},
  useJoker: () => {},
  requestQuestion: () => {},
  startGame: () => {},
  goToQuestion: () => {},
  retryConnection: () => {}
});

// Create a provider component to wrap our app
export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState({
    currentQuestion: '',
    options: [] as string[],
    jokerInfo: '',
    message: 'Connecting to game server...',
    messageType: 'info',
    allQuestions: [] as any[],
    currentQuestionIndex: 0,
    reconnecting: false,
    moneyLadder: moneyLadder,
    currentPrize: moneyLadder[moneyLadder.length - 1]
  });

  // Function to retry connection
  const retryConnection = () => {
    setGameState(prev => ({
      ...prev,
      message: 'Attempting to reconnect...',
      messageType: 'info',
      reconnecting: true
    }));

    // Force socket reconnection
    forceReconnect();

    // Reset reconnecting state after a delay regardless of outcome
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        reconnecting: false
      }));
    }, 3000);
  };

  // Helper function to parse Socket.IO formatted messages
  const parseSocketIOMessage = (rawData: string): string => {
    try {
      // Check if the message is in Socket.IO format (starts with a number followed by JSON)
      if (/^\d+\[.*\]$/.test(rawData)) {
        // Extract the actual data from the Socket.IO format (remove the leading number and parse JSON)
        const match = rawData.match(/^\d+(\[.*\])$/);
        if (match && match[1]) {
          const jsonData = JSON.parse(match[1]);
          // Socket.IO messages are typically arrays where the first item is the event name
          // and the rest are arguments. For our case, we want the first argument.
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            return jsonData[0];
          }
        }
      }
      // If not in Socket.IO format or parsing fails, return the original data
      return rawData;
    } catch (error) {
      console.error('Error parsing Socket.IO message:', error);
      return rawData;
    }
  };

  // Initialize socket with auto-reconnect capabilities
  useEffect(() => {
    // Initialize socket connection
    const newSocket = initializeSocket();
    setSocket(newSocket);

    // Set up socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to game server');
      setIsConnected(true);
      setGameState(prev => ({
        ...prev,
        message: 'Connected to game server!',
        messageType: 'info',
        reconnecting: false
      }));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from game server');
      setIsConnected(false);
      setGameState(prev => ({
        ...prev,
        message: 'Disconnected from game server. Reconnecting...',
        messageType: 'alert',
      }));

      // Try to reconnect automatically
      setTimeout(() => {
        if (!newSocket.connected) {
          retryConnection();
        }
      }, 2000);
    });

    // Socket error handling with auto-reconnect
    newSocket.on('error', () => {
      console.log('Socket error occurred');
      setIsConnected(false);
      setGameState(prev => ({
        ...prev,
        message: 'Connection error. Attempting to reconnect...',
        messageType: 'alert',
      }));

      // Try to reconnect automatically on error
      setTimeout(() => {
        if (!newSocket.connected) {
          retryConnection();
        }
      }, 2000);
    });

    // Handle alert messages from adapter
    newSocket.on('alert', (message: string) => {
      console.log('Received alert:', message);
      setGameState(prev => ({
        ...prev,
        message: message,
        messageType: 'alert',
      }));
      
      // If the message indicates connection loss
      if (message.includes('Connection to game server lost') ||
          message.includes('Unable to connect to game server')) {
        setIsConnected(false);
      }
    });

    // Handle raw game data from the adapter - now using 'gameData' event
    newSocket.on("gameData", (rawData: string) => {
      console.log('Received game data:', rawData);
      
      // Parse different message types from the data
      if (rawData.includes('QUESTION:')) {
        // Handle questions data
        parseAllQuestionsData(rawData);
      }
      else if (rawData.includes('Correct answer!')) {
        handleCorrectAnswer(rawData);
      }
      else if (rawData.includes('Wrong answer!')) {
        handleWrongAnswer(rawData);
      }
      else if (rawData.includes('Ask the Audience Results') || rawData.includes('50:50 Result')) {
        handleJokerResult(rawData);
      }
      else if (rawData.includes('Congratulations!')) {
        handleWinResult(rawData);
      }
      else {
        // General info message
        setGameState(prev => ({
          ...prev,
          message: rawData,
          messageType: 'info',
        }));
      }
    });

    // Keep handling the empty event for backward compatibility
    newSocket.on("", (rawData: string) => {
      console.log('Received legacy event data:', rawData);
      
      // Parse Socket.IO formatted message if necessary
      const data = parseSocketIOMessage(rawData);
      console.log('Parsed legacy data:', data);
      
      // Process data with the same handlers
      if (data.includes('QUESTION:')) {
        parseAllQuestionsData(data);
      }
      else if (data.includes('Correct answer!')) {
        handleCorrectAnswer(data);
      }
      else if (data.includes('Wrong answer!')) {
        handleWrongAnswer(data);
      }
      else if (data.includes('Ask the Audience Results') || data.includes('50:50 Result')) {
        handleJokerResult(data);
      }
      else if (data.includes('Congratulations!')) {
        handleWinResult(data);
      }
      else {
        setGameState(prev => ({
          ...prev,
          message: data,
          messageType: 'info',
        }));
      }
    });
    
    // Handle other event types
    newSocket.on('correct', (data: string) => {
      handleCorrectAnswer(data);
    });
    
    newSocket.on('wrong', (data: string) => {
      handleWrongAnswer(data);
    });
    
    newSocket.on('joker_result', (data: string) => {
      handleJokerResult(data);
    });
    
    newSocket.on('win', (data: string) => {
      handleWinResult(data);
    });
    
    newSocket.on('message', (data: string) => {
      setGameState(prev => ({
        ...prev,
        message: data,
        messageType: 'info',
      }));
    });
    
    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Helper function to parse question data received from server
  const parseAllQuestionsData = (data: string) => {
    try {
      const lines = data.split('\n');
      const questions: any[] = [];
      let jokers = '';
      let currentQuestionIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('QUESTION:')) {
          // Format: QUESTION:index:question_text
          const parts = line.split(':', 3);
          if (parts.length >= 3) {
            const index = parseInt(parts[1]);
            const question = parts[2];
            
            // Initialize question object in the array if needed
            while (questions.length <= index) {
              questions.push({ question: '', options: [] });
            }
            
            questions[index].question = question;
          }
        } 
        else if (line.startsWith('OPTIONS:')) {
          // Format: OPTIONS:index:optionA|optionB|optionC|optionD
          const parts = line.split(':', 3);
          if (parts.length >= 3) {
            const index = parseInt(parts[1]);
            const options = parts[2].split('|');
            
            // Initialize question object in the array if needed
            while (questions.length <= index) {
              questions.push({ question: '', options: [] });
            }
            
            questions[index].options = options;
          }
        }
        else if (line.startsWith('JOKERS:')) {
          // Format: JOKERS:jokers_text
          jokers = line.substring(7);
        }
      }
      
      // Update game state with parsed data
      if (questions.length > 0 && questions[0].question && questions[0].options) {
        setGameState(prev => ({
          ...prev,
          currentQuestion: questions[0].question,
          options: questions[0].options,
          jokerInfo: jokers,
          allQuestions: questions,
          currentQuestionIndex: 0,
          message: 'Game started! First question loaded.',
          messageType: 'info',
          currentPrize: moneyLadder[moneyLadder.length - 1]
        }));
      }
    } catch (error) {
      console.error('Error parsing question data:', error);
    }
  };
  
  // Helper function to handle correct answer responses
  const handleCorrectAnswer = (data: string) => {
    setGameState(prev => {
      const nextIndex = prev.currentQuestionIndex + 1;
      // Calculate the new prize level based on current question index
      const prizeIndex = Math.max(0, moneyLadder.length - 2 - prev.currentQuestionIndex);
      const newPrize = moneyLadder[prizeIndex];
      
      // If we have all questions data and there's a next question
      if (prev.allQuestions.length > 0 && nextIndex < prev.allQuestions.length) {
        const nextQuestion = prev.allQuestions[nextIndex];
        const nextPrizeIndex = Math.max(0, moneyLadder.length - 2 - nextIndex);
        
        return {
          ...prev,
          currentQuestionIndex: nextIndex,
          currentQuestion: nextQuestion.question,
          options: nextQuestion.options,
          message: data,
          messageType: 'correct',
          currentPrize: moneyLadder[nextPrizeIndex]
        };
      }
      return {
        ...prev,
        message: data,
        messageType: 'correct',
        currentPrize: newPrize
      };
    });
  };
  
  // Helper function to handle wrong answer responses
  const handleWrongAnswer = (data: string) => {
    setGameState(prev => ({
      ...prev,
      message: data,
      messageType: 'wrong',
    }));
  };
  
  // Helper function to handle joker results
  const handleJokerResult = (data: string) => {
    setGameState(prev => ({
      ...prev,
      message: data,
      messageType: 'joker',
    }));
  };
  
  // Helper function to handle win result
  const handleWinResult = (data: string) => {
    setGameState(prev => ({
      ...prev,
      message: data,
      messageType: 'win',
      currentPrize: moneyLadder[0] // Set to the highest prize
    }));
  };

  // Function to send an answer to the server
  const sendAnswer = (answer: string) => {
    if (socket && isConnected) {
      console.log('Sending answer:', answer);
      socket.emit('answer', answer);
    } else {
      console.error('Cannot send answer - socket not connected');
      // Show reconnection prompt
      setGameState(prev => ({
        ...prev,
        message: 'Cannot send answer - connection lost. Try reconnecting.',
        messageType: 'alert',
      }));
    }
  };

  // Function to use a joker
  const useJoker = (joker: string) => {
    if (socket && isConnected) {
      console.log('Using joker:', joker);
      socket.emit('joker', joker);
    } else {
      console.error('Cannot use joker - socket not connected');
      // Show reconnection prompt
      setGameState(prev => ({
        ...prev,
        message: 'Cannot use joker - connection lost. Try reconnecting.',
        messageType: 'alert',
      }));
    }
  };

  // Function to request a new question
  const requestQuestion = () => {
    if (socket && isConnected) {
      console.log('Requesting new question');
      socket.emit('requestQuestion');
    } else {
      console.error('Cannot request question - socket not connected');
      // Show reconnection prompt
      setGameState(prev => ({
        ...prev,
        message: 'Cannot request question - connection lost. Try reconnecting.',
        messageType: 'alert',
      }));
    }
  };

  // Function to start a new game
  const startGame = () => {
    if (socket && isConnected) {
      console.log('Starting a new game');
      
      // Reset game state first
      setGameState(prev => ({
        ...prev,
        currentQuestion: '',
        options: [],
        jokerInfo: '',
        allQuestions: [],
        currentQuestionIndex: 0,
        message: 'Starting a new game...',
        messageType: 'info',
        currentPrize: moneyLadder[moneyLadder.length - 1]
      }));

      // Send startGame event to server with a slight delay to ensure state reset is processed
      setTimeout(() => {
        console.log('Emitting startGame event');
        socket.emit('startGame');
      }, 100);
    } else {
      console.error('Cannot start game - socket not connected');
      // Show reconnection prompt
      setGameState(prev => ({
        ...prev,
        message: 'Cannot start game - connection lost. Try reconnecting.',
        messageType: 'alert'
      }));
    }
  };
  
  // Function to navigate to a specific question by index
  const goToQuestion = (index: number) => {
    if (gameState.allQuestions.length > 0 && index >= 0 && index < gameState.allQuestions.length) {
      const targetQuestion = gameState.allQuestions[index];
      const targetPrizeIndex = Math.max(0, moneyLadder.length - 2 - index);
      
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: index,
        currentQuestion: targetQuestion.question,
        options: targetQuestion.options,
        message: `Showing question ${index + 1}`,
        messageType: 'info',
        currentPrize: moneyLadder[targetPrizeIndex]
      }));
    }
  };

  // Provide the context value to consumers
  const contextValue = {
    socket,
    gameState,
    isConnected,
    sendAnswer,
    useJoker,
    requestQuestion,
    startGame,
    goToQuestion,
    retryConnection
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGameContext = () => useContext(GameContext);