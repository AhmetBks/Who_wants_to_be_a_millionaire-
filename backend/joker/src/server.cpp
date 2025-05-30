#include <iostream>
#include "../include/server.h" 
#include <sys/socket.h>
#include <unistd.h>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <thread>
#include <map>
#include "../include/joker.h"

using namespace std;

// Global joker instance to be accessed by client handlers
Joker* jokerService = nullptr;

// Map to track game server client sockets and their associated WebSocket client IDs
map<int, string> clientConnections;

Server::Server(int port) {
    p = port;

    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("Socket failed");
        exit(EXIT_FAILURE);
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(p);

    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        perror("Bind failed");
        exit(EXIT_FAILURE);
    }
}

void Server::setJokerService(Joker* joker) {
    jokerService = joker;
}

void Server::start() {
    int addrlen = sizeof(address);
    if (listen(server_fd, 3) < 0) {
        perror("Listen failed");
        exit(EXIT_FAILURE);
    }

    cout << "Joker Server waiting for connections on port " << p << "...\n";
    while (true) {
        if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0) {
            perror("Accept failed");
            exit(EXIT_FAILURE);
        }
        
        cout << "Connection established with a game host!\n";

        thread(&Server::handle_client, this, new_socket).detach(); 
    }
}

// Helper function to parse client ID from requests
pair<string, string> parseCommand(const string& cmd) {
    // Format: ACTION-[clientId:]DATA
    size_t dashPos = cmd.find('-');
    if (dashPos == string::npos) {
        return make_pair("", "");
    }
    
    string action = cmd.substr(0, dashPos);
    string data = cmd.substr(dashPos + 1);
    
    // Check if there's a client ID in the data
    size_t colonPos = data.find(':');
    string clientId = "";
    
    if (colonPos != string::npos) {
        clientId = data.substr(0, colonPos);
        data = data.substr(colonPos + 1);
        return make_pair(action, clientId);
    }
    
    return make_pair(action, "");
}

void Server::handle_client(int client_socket) {
    char buffer[1024] = {0};
    string welcome_msg = "Connected to Joker Server. Ready to process lifeline requests.\n";
    send(client_socket, welcome_msg.c_str(), welcome_msg.length(), 0);

    while (true) {
        memset(buffer, 0, sizeof(buffer));
        int bytes_read = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
        
        if (bytes_read <= 0) {
            // Connection closed or error
            cout << "Client disconnected." << endl;
            
            // Remove from connections map if present
            clientConnections.erase(client_socket);
            break;
        }
        
        string request(buffer);
        cout << "Received request: " << request << endl;
        
        // Check if this is a registration request with a WebSocket client ID
        auto [action, clientId] = parseCommand(request);
        
        if (action == "REGISTER" && !clientId.empty()) {
            // Store the client socket and WebSocket ID association
            clientConnections[client_socket] = clientId;
            cout << "Registered connection from game server for WebSocket client: " << clientId << endl;
            
            // Also register with the joker service
            if (jokerService != nullptr) {
                jokerService->register_client(client_socket, clientId.c_str());
            }
            
            // Send confirmation
            string response = "REGISTERED-" + clientId;
            send(client_socket, response.c_str(), response.length(), 0);
            continue;
        }
        
        // Process the request using the joker service
        if (jokerService != nullptr) {
            jokerService->process_request(request, client_socket);
        } else {
            cout << "Error: Joker service not initialized!" << endl;
            string error_msg = "ERROR-Joker service not available";
            send(client_socket, error_msg.c_str(), error_msg.length(), 0);
        }
    }
    
    close(client_socket);
}
