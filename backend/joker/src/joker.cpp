#include <iostream>
#include <cstring>
#include <cstdlib>
#include <ctime>
#include <sys/socket.h>
#include <map>
#include "../include/joker.h"
#include "../include/entry.h"

using namespace std;

// Map to store client WebSocket IDs
map<int, string> clientWebsocketIds;

Joker::Joker(int max_clients) {
    m = max_clients;
    currentSize = 0;
    
    // Seed the random number generator for 50:50 lifeline
    srand(time(nullptr));
}

void Joker::register_client(int client_socket, const char* value) {
    if (currentSize < MAX_SIZE) {
        map[currentSize].key = client_socket;
        strncpy(map[currentSize].value, value, sizeof(map[currentSize].value) - 1);
        map[currentSize].value[sizeof(map[currentSize].value) - 1] = '\0';
        currentSize++;
        
        // Store the WebSocket ID in our map
        clientWebsocketIds[client_socket] = string(value);
        cout << "Client registered with socket: " << client_socket << " and WebSocket ID: " << value << endl;
    } else {
        cout << "Map is full! Cannot register more clients." << endl;
    }
}

string Joker::get_audience_results(int question_index) {
    // For each question, provide different audience poll percentages
    string results;
    
    switch (question_index) {
        case 0: // Python year question
            results = "A:40%,B:25%,C:30%,D:5%";
            break;
        case 1: // C++ year question
            results = "A:45%,B:35%,C:15%,D:5%";
            break;
        case 2: // HTML question
            results = "A:10%,B:60%,C:25%,D:5%";
            break;
        case 3: // TCP question
            results = "A:55%,B:20%,C:15%,D:10%";
            break;
        case 4: // Client-server question
            results = "A:15%,B:65%,C:10%,D:10%";
            break;
        default:
            results = "A:25%,B:25%,C:25%,D:25%";
    }
    
    return results;
}

string Joker::get_fifty_fifty_options(int question_index, char correct_answer) {
    char options[4] = {'A', 'B', 'C', 'D'};
    string result = "";
    
    // Always include the correct answer
    result += correct_answer;
    
    // Randomly select one incorrect answer to keep
    char second_option;
    do {
        int random_index = rand() % 4;
        second_option = options[random_index];
    } while (second_option == correct_answer);
    
    result += "," + string(1, second_option);
    return result;
}

void Joker::process_request(const string& request, int client_socket) {
    cout << "Processing request: " << request << " from socket: " << client_socket << endl;
    
    // Parse the request string based on the protocol format: ACTION-DATA
    size_t delimiter_pos = request.find('-');
    
    if (delimiter_pos == string::npos) {
        cout << "Invalid request format: " << request << endl;
        string error_response = "ERROR-Invalid request format";
        send(client_socket, error_response.c_str(), error_response.length(), 0);
        return;
    }
    
    string action = request.substr(0, delimiter_pos);
    string data = request.substr(delimiter_pos + 1);
    
    cout << "Action: " << action << ", Data: " << data << endl;
    
    // Check if the request includes a WebSocket client ID
    size_t client_id_pos = data.find(':');
    string client_id = "";
    
    if (client_id_pos != string::npos) {
        client_id = data.substr(0, client_id_pos);
        data = data.substr(client_id_pos + 1);
        cout << "WebSocket Client ID: " << client_id << ", Actual data: " << data << endl;
    }
    
    if (action == "REGISTER") {
        register_client(client_socket, data.c_str());
        
        // Confirm registration
        string response = "REGISTERED-" + string(data);
        send(client_socket, response.c_str(), response.length(), 0);
    } 
    else if (action == "AUDIENCE") {
        // Format: AUDIENCE-question_index or AUDIENCE-clientId:question_index
        int question_index;
        
        if (client_id.empty()) {
            question_index = stoi(data);
        } else {
            question_index = stoi(data);
        }
        
        string result = get_audience_results(question_index);
        
        // Send the result back to the client, including client ID if provided
        string response;
        if (client_id.empty()) {
            response = "AUDIENCE_RESULT-" + result;
        } else {
            response = "AUDIENCE_RESULT-" + client_id + ":" + result;
        }
        
        send(client_socket, response.c_str(), response.length(), 0);
        cout << "Sent audience results: " << response << endl;
    } 
    else if (action == "FIFTY_FIFTY") {
        // Format: FIFTY_FIFTY-question_index,correct_answer or FIFTY_FIFTY-clientId:question_index,correct_answer
        string payload = data;
        size_t comma_pos = payload.find(',');
        
        if (comma_pos == string::npos) {
            cout << "Invalid FIFTY_FIFTY request format" << endl;
            string error_response = "ERROR-Invalid FIFTY_FIFTY request format";
            send(client_socket, error_response.c_str(), error_response.length(), 0);
            return;
        }
        
        int question_index = stoi(payload.substr(0, comma_pos));
        char correct_answer = payload.substr(comma_pos + 1)[0];
        
        string result = get_fifty_fifty_options(question_index, correct_answer);
        
        // Send the result back to the client, including client ID if provided
        string response;
        if (client_id.empty()) {
            response = "FIFTY_FIFTY_RESULT-" + result;
        } else {
            response = "FIFTY_FIFTY_RESULT-" + client_id + ":" + result;
        }
        
        send(client_socket, response.c_str(), response.length(), 0);
        cout << "Sent fifty-fifty results: " << response << endl;
    }
    else if (action == "GET_JOKERS") {
        // Return the available jokers
        string available_jokers = "Ask the Audience (S), 50:50 (Y)";
        
        // Send the result back to the client, including client ID if provided
        string response;
        if (client_id.empty()) {
            response = "AVAILABLE_JOKERS-" + available_jokers;
        } else {
            response = "AVAILABLE_JOKERS-" + client_id + ":" + available_jokers;
        }
        
        send(client_socket, response.c_str(), response.length(), 0);
        cout << "Sent available jokers: " << response << endl;
    } 
    else if (action == "DISCONNECT") {
        // Client is disconnecting, remove from our maps
        for (int i = 0; i < currentSize; i++) {
            if (map[i].key == client_socket) {
                // Remove by shifting remaining entries
                for (int j = i; j < currentSize - 1; j++) {
                    map[j] = map[j+1];
                }
                currentSize--;
                break;
            }
        }
        
        // Remove from WebSocket ID map
        clientWebsocketIds.erase(client_socket);
        cout << "Client disconnected and removed from maps" << endl;
    }
    else {
        cout << "Unknown action: " << action << endl;
        string error_response = "ERROR-Unknown action: " + action;
        send(client_socket, error_response.c_str(), error_response.length(), 0);
    }
}



