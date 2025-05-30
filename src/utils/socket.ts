import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    // Connect directly to the adapter on port 3001
    socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10, // Increased from 5 to 10
      reconnectionDelay: 1000,
      timeout: 10000, // Add connection timeout (10s)
      autoConnect: true
    });
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket adapter');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket adapter');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      
      // Attempt to reconnect after a connection error
      setTimeout(() => {
        console.log('Attempting to reconnect after error...');
        if (socket) {
          socket.connect();
        }
      }, 2000);
    });
    
    // Add reconnect event listeners
    socket.io.on('reconnect', (attempt) => {
      console.log(`Reconnected to server after ${attempt} attempts`);
    });
    
    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt: ${attempt}`);
    });
    
    socket.io.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });
    
    socket.io.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
    });
  }
  
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// New method to force reconnection
export const forceReconnect = (): void => {
  if (socket) {
    socket.disconnect(); // First disconnect
    
    // Then reconnect
    setTimeout(() => {
      socket?.connect();
    }, 1000);
  } else {
    // If no socket exists, initialize a new one
    initializeSocket();
  }
};