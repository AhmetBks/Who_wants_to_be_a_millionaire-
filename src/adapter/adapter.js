const { createServer } = require('http');
const { Server } = require('socket.io');
const net = require('net');

// Create HTTP server and Socket.IO instance
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Game server connection details
const GAME_SERVER_HOST = '127.0.0.1';
const GAME_SERVER_PORT = 4337;

// Client connections mapping
const clients = new Map(); // Maps socketId to TCP connection

// Handle Socket.IO connections from web clients
io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id);
  
  // Create individual TCP connection for each client
  const tcpClient = new net.Socket();
  
  // Connect to game server
  tcpClient.connect(GAME_SERVER_PORT, GAME_SERVER_HOST, () => {
    console.log(`[${socket.id}] Connected to game server`);
    
    // Send socket ID to game server on connection
    tcpClient.write(`CLIENT_ID:${socket.id}\n`);
  });
  
  // Store the TCP client for this socket
  clients.set(socket.id, tcpClient);
  
  // Forward all data from game server to frontend
  tcpClient.on('data', (data) => {
    try {
      const message = data.toString().trim();
      console.log(`[${socket.id}] Received from game server: ${message}`);
      
      // Parse different message types
      if (message.includes('ALL_QUESTIONS_DATA')) {
        // Send the entire questions data to frontend
        socket.emit('gameData', message);
      }
      else if (message.includes('QUESTION:')) {
        // Send question
        socket.emit('gameData', message);
      }
      else if (message.includes('JOKERS:')) {
        // Send jokers info
        socket.emit('gameData', message);
      }
      else if (message.includes('Welcome to the game server')) {
        // Send welcome message as normal message
        socket.emit('message', message);
      }
      else if (message.includes('Ask the Audience Results')) {
        // Special handling for audience joker results
        socket.emit('joker_result', message);
      }
      else if (message.includes('50:50 Result')) {
        // Special handling for 50:50 joker results
        socket.emit('joker_result', message);
      }
      else if (message.includes('Skip joker used')) {
        // Special handling for skip joker results
        socket.emit('joker_result', message);
      }
      else if (message.includes('Correct answer')) {
        // Send correct answer notification
        socket.emit('correct', message);
      }
      else if (message.includes('Wrong answer')) {
        // Send wrong answer notification
        socket.emit('wrong', message);
      }
      else if (message.includes('Congratulations')) {
        // Send win notification
        socket.emit('win', message);
      }
      else if (message.includes('ERROR:')) {
        // Send error messages as alerts
        socket.emit('alert', message);
      }
      else {
        // Default: general message
        socket.emit('message', message);
      }
    } catch (error) {
      console.error(`[${socket.id}] Error processing data from server:`, error);
      socket.emit('alert', 'Error processing data from game server');
    }
  });
  
  // Handle connection errors
  tcpClient.on('error', (err) => {
    console.error(`[${socket.id}] TCP connection error:`, err);
    socket.emit('alert', 'Connection to game server lost. Please reload the page.');
  });
  
  // Handle TCP connection close
  tcpClient.on('close', () => {
    console.log(`[${socket.id}] TCP connection closed`);
    socket.emit('alert', 'Game server connection closed. Please reload the page to reconnect.');
  });
  
  // Forward startGame command from frontend to backend
  socket.on('startGame', () => {
    console.log(`[${socket.id}] Client requested to start a new game`);
    const tc = clients.get(socket.id);
    
    if (tc && !tc.destroyed) {
      try {
        tc.write(`START:${socket.id}\n`);
      } catch (error) {
        console.error(`[${socket.id}] Error starting game:`, error);
      }
    } else {
      socket.emit('alert', 'Connection to game server lost. Please reload the page.');
    }
  });
  
  // Forward answer from frontend to backend
  socket.on('answer', (answer) => {
    console.log(`[${socket.id}] Sending answer to game server:`, answer);
    const tc = clients.get(socket.id);
    
    if (tc && !tc.destroyed) {
      try {
        tc.write(`ANSWER:${socket.id}:${answer}\n`);
      } catch (error) {
        console.error(`[${socket.id}] Error sending answer:`, error);
      }
    } else {
      socket.emit('alert', 'Connection to game server lost. Please reload the page.');
    }
  });
  
  // Forward joker requests from frontend to backend
  socket.on('joker', (joker) => {
    console.log(`[${socket.id}] Sending joker request to game server:`, joker);
    const tc = clients.get(socket.id);
    
    if (tc && !tc.destroyed) {
      try {
        tc.write(`JOKER:${socket.id}:${joker}\n`);
      } catch (error) {
        console.error(`[${socket.id}] Error sending joker request:`, error);
      }
    } else {
      socket.emit('alert', 'Connection to game server lost. Please reload the page.');
    }
  });
  
  // Forward manual question request from frontend to backend
  socket.on('requestQuestion', () => {
    console.log(`[${socket.id}] Client requested question manually`);
    const tc = clients.get(socket.id);
    
    if (tc && !tc.destroyed) {
      try {
        tc.write(`REQUEST:${socket.id}\n`);
      } catch (error) {
        console.error(`[${socket.id}] Error requesting question:`, error);
      }
    } else {
      socket.emit('alert', 'Connection to game server lost. Please reload the page.');
    }
  });
  
  // Forward goto question request from frontend to backend
  socket.on('goToQuestion', (questionIndex) => {
    console.log(`[${socket.id}] Client requested to go to question ${questionIndex}`);
    const tc = clients.get(socket.id);
    
    if (tc && !tc.destroyed) {
      try {
        tc.write(`GOTO:${socket.id}:${questionIndex}\n`);
      } catch (error) {
        console.error(`[${socket.id}] Error requesting to go to question:`, error);
      }
    } else {
      socket.emit('alert', 'Connection to game server lost. Please reload the page.');
    }
  });
  
  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log(`[${socket.id}] WebSocket client disconnected`);
    
    // Get the associated TCP connection
    const tc = clients.get(socket.id);
    
    if (tc) {
      // Notify server about client disconnection
      try {
        tc.write(`DISCONNECT:${socket.id}\n`);
      } catch (error) {
        console.error(`[${socket.id}] Error notifying server about disconnection:`, error);
      }
      
      // Close TCP connection
      tc.end();
      
      // Remove from clients map
      clients.delete(socket.id);
    }
  });
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket adapter...');
  
  // Close all TCP connections
  for (const [socketId, connection] of clients.entries()) {
    try {
      connection.end();
    } catch (error) {
      console.error(`Error ending connection for ${socketId}:`, error);
    }
  }
  
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Keep the process alive but log the error
});

// Start HTTP server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`WebSocket adapter running on port ${PORT}`);
});