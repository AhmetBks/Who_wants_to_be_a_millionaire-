#include <iostream>
#include "server.h" 
#include <sys/socket.h>
#include <unistd.h>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <thread>
#include <map>
#include <string>
#include "joker.h"
#include <sstream>

using namespace std;

// Global joker client
Joker* jokerClient = nullptr;

// Map to track websocket client IDs to their TCP socket connections
map<string, int> clientSockets;

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

void Server::setJokerClient(Joker* joker) {
    jokerClient = joker;
}

void Server::start() {
    // Connect to joker service
    if (jokerClient != nullptr) {
        if (!jokerClient->connect()) {
            cout << "Warning: Failed to connect to joker service, lifelines will use fallback mode" << endl;
        }
    }

    int addrlen = sizeof(address);
    if (listen(server_fd, 3) < 0) {
        perror("Listen failed");
        exit(EXIT_FAILURE);
    }

    cout << "Waiting for a connection on port " << p << "...\n";
    while (true) {
        if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0) {
            perror("Accept failed");
            exit(EXIT_FAILURE);
        }
        
        cout << "Connection established with client!\n";

        thread(&Server::handle_client, this, new_socket).detach(); 
    }
}

// Helper function to parse commands coming from WebSocket adapter
pair<string, string> parseCommand(const string& cmd) {
    size_t colonPos = cmd.find(':');
    if (colonPos == string::npos) {
        return make_pair("UNKNOWN", "");
    }
    
    string action = cmd.substr(0, colonPos);
    string data = cmd.substr(colonPos + 1);
    
    // Further parse the data to separate client ID from actual data
    size_t secondColonPos = data.find(':');
    string clientId = data;
    string payload = "";
    
    if (secondColonPos != string::npos) {
        clientId = data.substr(0, secondColonPos);
        payload = data.substr(secondColonPos + 1);
    }
    
    return make_pair(action, clientId);
}

void Server::handle_client(int client_socket) {
    string questions[5] = {
        "1. When was Python created?",
        "2. When was C++ released?",
        "3. What is HTML?",
        "4. What is TCP?",
        "5. What is Client-Server?"
    };
    
    string options[5][4] = {
        {"A) 1991", "B) 2000", "C) 1989", "D) 2010"},
        {"A) 1985", "B) 1990", "C) 2000", "D) 2010"},
        {"A) Programming Language", "B) Web Markup Language", "C) Web Browser", "D) Database"},
        {"A) Connection-Based", "B) Connectionless", "C) Fast", "D) Packaged"},
        {"A) Data sharing on same computer", "B) Server-client relationship", "C) Network protocol", "D) Internet service provider"}
    };
    
    string correct_answers[5] = {"A", "A", "B", "A", "B"};
    string reward_messages[6] = {
        "Loading the Lynch...",
        "The important thing is to join",
        "Two is greater than one",
        "It wasn't easy getting here",
        "You know your stuff!",
        "You're amazing!"
    };
    
    // First, check if this is a registration command
    char cmd_buffer[1024] = {0};
    int bytes_read = recv(client_socket, cmd_buffer, sizeof(cmd_buffer) - 1, 0);
    
    if (bytes_read <= 0) {
        cout << "Client disconnected during registration" << endl;
        close(client_socket);
        return;
    }
    
    string cmd(cmd_buffer);
    cout << "Received command: " << cmd << endl;
    
    // Parse the command to extract action and client ID
    auto [action, clientId] = parseCommand(cmd);
    
    if (action == "CLIENT_ID") {
        cout << "Registering client with WebSocket ID: " << clientId << endl;
        clientSockets[clientId] = client_socket;
        
        // Send welcome message back to the client
        string welcome_msg = "Welcome to the game server. You are now connected as " + clientId + "\n";
        send(client_socket, welcome_msg.c_str(), welcome_msg.length(), 0);
    }
    
    bool joker_used[2] = {false, false}; // [0] = Ask the Audience, [1] = 50:50
    int score = 0;
    bool game_over = false;
    int current_question = 0;
    string websocketClientId = clientId; // Store client ID for future communications
    
    // Main command processing loop
    while (true) {
        memset(cmd_buffer, 0, sizeof(cmd_buffer));
        bytes_read = recv(client_socket, cmd_buffer, sizeof(cmd_buffer) - 1, 0);
        
        if (bytes_read <= 0) {
            cout << "Client " << websocketClientId << " disconnected" << endl;
            clientSockets.erase(websocketClientId);
            break;
        }
        
        cmd = string(cmd_buffer);
        cout << "Received command from " << websocketClientId << ": " << cmd << endl;
        
        auto [cmdAction, cmdClientId] = parseCommand(cmd);
        
        // Check if this is the same client or if we need to update our client ID
        if (!cmdClientId.empty()) {
            websocketClientId = cmdClientId;
        }
        
        // Process different command types
        if (cmdAction == "START") {
            cout << "Starting new game for client: " << websocketClientId << endl;
            
            // Get available jokers from joker service
            string available_jokers = "JOKERS:";
            if (jokerClient != nullptr && jokerClient->is_connected) {
                // Request available jokers from joker service
                available_jokers += jokerClient->get_available_jokers();
            } else {
                // Use default jokers if joker service is not available
                available_jokers += "Ask the Audience (S), 50:50 (Y)";
            }
            
            // Create a single message with all question data
            stringstream all_data;
            all_data << "ALL_QUESTIONS_DATA\n";
            
            // Add all questions and options
            for (int i = 0; i < 5; i++) {
                all_data << "QUESTION:" << i << ":" << questions[i] << "\n";
                all_data << "OPTIONS:" << i << ":";
                for (int j = 0; j < 4; j++) {
                    all_data << options[i][j];
                    if (j < 3) all_data << "|";
                }
                all_data << "\n";
            }
            
            // Add joker information
            all_data << available_jokers << "\n";
            
            string data_str = all_data.str();
            // Send all data in one TCP message and append a newline to ensure proper parsing
            send(client_socket, data_str.c_str(), data_str.length(), 0);
        }
        else if (cmdAction == "ANSWER") {
            // Extract the answer from the payload
            size_t lastColonPos = cmd.find_last_of(':');
            if (lastColonPos != string::npos && lastColonPos < cmd.length() - 1) {
                string answer = cmd.substr(lastColonPos + 1);
                answer = answer.substr(0, 1); // Get just the first letter (A, B, C, D)
                
                if (answer == "A" || answer == "B" || answer == "C" || answer == "D") {
                    if (answer[0] == correct_answers[current_question][0]) {
                        score = current_question + 1;
                        string correct_msg = "Correct answer! \n";
                        send(client_socket, correct_msg.c_str(), correct_msg.length(), 0);
                        
                        // Move to the next question
                        current_question++;
                        
                        // If all questions answered correctly, display win message
                        if (current_question >= 5) {
                            string win_msg = "Congratulations! You've won the game! " + reward_messages[5] + "\n";
                            send(client_socket, win_msg.c_str(), win_msg.length(), 0);
                            game_over = true;
                        }
                    } else {
                        game_over = true;
                        string wrong_msg = "Wrong answer! " + reward_messages[score] + "\n";
                        send(client_socket, wrong_msg.c_str(), wrong_msg.length(), 0);
                    }
                } else {
                    string invalid_msg = "Invalid answer. Please enter A, B, C, or D.\n";
                    send(client_socket, invalid_msg.c_str(), invalid_msg.length(), 0);
                }
            }
        }
        else if (cmdAction == "JOKER") {
            // Extract joker type from the payload
            size_t lastColonPos = cmd.find_last_of(':');
            if (lastColonPos != string::npos && lastColonPos < cmd.length() - 1) {
                string jokerType = cmd.substr(lastColonPos + 1);
                
                if (jokerType == "audience" && !joker_used[0]) {
                    // Handle "Ask the Audience" joker
                    string joker_response = process_audience_joker(current_question, websocketClientId);
                    send(client_socket, joker_response.c_str(), joker_response.length(), 0);
                    joker_used[0] = true;
                } 
                else if ((jokerType == "50-50" || jokerType == "Y") && !joker_used[1]) {
                    // Handle "50:50" joker
                    string joker_response = process_fifty_fifty_joker(current_question, correct_answers[current_question], websocketClientId);
                    send(client_socket, joker_response.c_str(), joker_response.length(), 0);
                    joker_used[1] = true;
                }
                else if (jokerType == "skip" && !joker_used[2]) {
                    // Handle "skip" joker (if implemented)
                    string joker_response = "Skip joker used. Moving to next question.\n";
                    send(client_socket, joker_response.c_str(), joker_response.length(), 0);
                    joker_used[2] = true;
                    
                    // Move to the next question
                    current_question++;
                }
                else {
                    string invalid_msg = "Invalid joker or joker already used.\n";
                    send(client_socket, invalid_msg.c_str(), invalid_msg.length(), 0);
                }
            }
        }
        else if (cmdAction == "REQUEST") {
            // Client is requesting the current question again
            if (current_question < 5 && !game_over) {
                string question_msg = "QUESTION:" + to_string(current_question) + ":" + questions[current_question] + "\n";
                question_msg += "OPTIONS:" + to_string(current_question) + ":";
                
                for (int j = 0; j < 4; j++) {
                    question_msg += options[current_question][j];
                    if (j < 3) question_msg += "|";
                }
                question_msg += "\n";
                
                send(client_socket, question_msg.c_str(), question_msg.length(), 0);
            }
        }
        else if (cmdAction == "DISCONNECT") {
            cout << "Client " << websocketClientId << " requested disconnection" << endl;
            clientSockets.erase(websocketClientId);
            break;
        }
        
        // Exit the loop if game is over
        if (game_over) {
            break;
        }
    }
    
    close(client_socket);
}

string Server::process_audience_joker(int question_index, const string& clientId) {
    if (jokerClient != nullptr && jokerClient->is_connected) {
        // Register client if not already done
        jokerClient->register_client(clientId);
        
        // Use the new version that passes client ID
        return jokerClient->request_audience_help(question_index, clientId);
    } else {
        // Fallback if joker client is not available
        string percentages[4] = {"40%", "25%", "30%", "5%"};
        
        string result = "Ask the Audience Results:\n";
        result += "A: " + percentages[0] + ", B: " + percentages[1];
        result += ", C: " + percentages[2] + ", D: " + percentages[3] + "\n";
        
        return result;
    }
}

string Server::process_fifty_fifty_joker(int question_index, string correct_answer, const string& clientId) {
    if (jokerClient != nullptr && jokerClient->is_connected) {
        // Register client if not already done
        jokerClient->register_client(clientId);
        
        // Use the new version that passes client ID
        return jokerClient->request_fifty_fifty(question_index, correct_answer[0], clientId);
    } else {
        // Fallback if joker client is not available
        char options[4] = {'A', 'B', 'C', 'D'};
        string remaining_options = "";
        
        // Always keep the correct answer
        remaining_options += correct_answer + ") ";
        
        // Add one more random incorrect option
        int random_option;
        do {
            random_option = rand() % 4;
        } while (options[random_option] == correct_answer[0]);
        
        remaining_options += options[random_option];
        remaining_options += "\n";
        
        return "50:50 Result: Remaining options: " + remaining_options;
    }
}
