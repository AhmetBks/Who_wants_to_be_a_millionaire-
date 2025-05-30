import { NextRequest } from 'next/server';
import { Server } from 'socket.io';
import net from 'net';

// This is needed to keep track of the Socket.IO server instance across HMR updates
let io: any;

// Game server connection details
const GAME_SERVER_HOST = '127.0.0.1';
const GAME_SERVER_PORT = 3001;

// Map to store TCP client connections for each socket
const tcpClients = new Map();

export function GET(req: NextRequest) {
  if (!io) {
    // Set up the Socket.IO server
    const { socket, response } = setupSocketIO(req);
    
    // Configure Socket.IO
    io = new Server(socket.server);

    // Handle Socket.IO connections
    io.on('connection', (socket: any) => {
      console.log('Client connected:', socket.id);
      
      // Create TCP connection to game server
      const tcpClient = new net.Socket();
      tcpClients.set(socket.id, tcpClient);
      
      tcpClient.connect(GAME_SERVER_PORT, GAME_SERVER_HOST, () => {
        console.log('Connected to game server for client:', socket.id);
      });
      
      // Handle data from game server
      tcpClient.on('data', (data) => {
        const message = data.toString().trim();
        console.log('Received from game server:', message);
        
        // Parse the message based on content
        if (message.includes('question_index')) {
          socket.emit('question', message);
        } else if (message.includes('options:')) {
          socket.emit('options', message.replace('options:', ''));
        } else if (message.includes('jokers:')) {
          socket.emit('jokers', message.replace('jokers:', ''));
        } else if (message.includes('Ask the Audience Results') || message.includes('50:50 Result')) {
          socket.emit('joker_result', message);
        } else if (message.includes('Correct answer!')) {
          socket.emit('correct', message);
        } else if (message.includes('Wrong answer!')) {
          socket.emit('wrong', message);
        } else if (message.includes('Congratulations!')) {
          socket.emit('win', message);
        } else {
          // Default: treat as regular message
          socket.emit('message', message);
        }
      });
      
      // Handle client disconnection
      tcpClient.on('close', () => {
        console.log('Connection to game server closed for client:', socket.id);
        socket.disconnect();
      });
      
      // Handle errors
      tcpClient.on('error', (err) => {
        console.error('TCP connection error for client', socket.id, ':', err);
        socket.emit('message', 'Error connecting to game server: ' + err.message);
      });
      
      // Handle answers from web client
      socket.on('answer', (answer) => {
        const client = tcpClients.get(socket.id);
        if (client) {
          client.write(answer);
        }
      });
      
      // Handle joker requests from web client
      socket.on('joker', (joker) => {
        const client = tcpClients.get(socket.id);
        if (client) {
          client.write(joker);
        }
      });
      
      // Handle web client disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        const client = tcpClients.get(socket.id);
        if (client) {
          client.destroy();
          tcpClients.delete(socket.id);
        }
      });
    });
  }
  
  return new Response('WebSocket server is running');
}

// Helper function to setup Socket.IO with the Next.js API route
function setupSocketIO(req: NextRequest) {
  const upgrade = req.headers.get('upgrade') || '';
  const connection = req.headers.get('connection') || '';
  
  if (upgrade.toLowerCase() !== 'websocket' || connection.toLowerCase() !== 'upgrade') {
    return {
      response: new Response('Expected Upgrade: websocket', { status: 426 }),
    };
  }
  
  const socket = new WebSocket(req.url);
  const response = new Response(null, {
    status: 101,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': 'required-but-value-not-checked',
    },
  });
  
  socket.addEventListener('message', (event) => {
    console.log('WebSocket message:', event.data);
  });
  
  return { socket, response };
}