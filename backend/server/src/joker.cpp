#include <iostream>
#include <unistd.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "../include/joker.h"

using namespace std;

Joker::Joker(string host, int port) {
    p = port;
    h = host;
    is_connected = false;

    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
        perror("Socket creation failed");
        return;
    }

    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(p);

    if (inet_pton(AF_INET, h.c_str(), &serv_addr.sin_addr) <= 0) {
        perror("Invalid address / Address not supported");
        return;
    }
}

bool Joker::connect() {
    if (::connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) {
        perror("Connection to joker server failed");
        return false;
    }

    cout << "Connected to joker server at " << h << ":" << p << endl;
    is_connected = true;
    
    // Read welcome message from joker server
    char buffer[1024] = {0};
    read(sock, buffer, sizeof(buffer));
    cout << "Joker server message: " << buffer << endl;
    
    return true;
}

string Joker::get_available_jokers(const string& clientId) {
    if (!is_connected) {
        if (!connect()) {
            return "Ask the Audience (S), 50:50 (Y)"; // Default jokers if can't connect
        }
    }
    
    // Format the request according to the protocol, including client ID if provided
    string request;
    if (clientId.empty()) {
        request = "GET_JOKERS-0";
    } else {
        request = "GET_JOKERS-" + clientId + ":0";
    }
    
    // Send the request
    send(sock, request.c_str(), request.length(), 0);
    
    // Receive the response
    char buffer[1024] = {0};
    int bytes_read = read(sock, buffer, sizeof(buffer));
    
    if (bytes_read <= 0) {
        is_connected = false;
        return "Ask the Audience (S), 50:50 (Y)"; // Default jokers if no response
    }
    
    // Parse the response
    string response(buffer);
    size_t delimiter_pos = response.find('-');
    
    if (delimiter_pos == string::npos) {
        return "Ask the Audience (S), 50:50 (Y)"; // Default jokers if invalid format
    }
    
    string action = response.substr(0, delimiter_pos);
    string data = response.substr(delimiter_pos + 1);
    
    if (action != "AVAILABLE_JOKERS") {
        return "Ask the Audience (S), 50:50 (Y)"; // Default jokers if unexpected response
    }
    
    // If response includes client ID, extract just the jokers part
    size_t colon_pos = data.find(':');
    if (colon_pos != string::npos) {
        data = data.substr(colon_pos + 1);
    }
    
    return data; // Return the available jokers from the joker service
}

string Joker::request_audience_help(int question_index, const string& clientId) {
    if (!is_connected) {
        if (!connect()) {
            return "ERROR: Not connected to joker server";
        }
    }
    
    // Format the request according to the protocol, including client ID if provided
    string request;
    if (clientId.empty()) {
        request = "AUDIENCE-" + to_string(question_index);
    } else {
        request = "AUDIENCE-" + clientId + ":" + to_string(question_index);
    }
    
    // Send the request
    send(sock, request.c_str(), request.length(), 0);
    
    // Receive the response
    char buffer[1024] = {0};
    int bytes_read = read(sock, buffer, sizeof(buffer));
    
    if (bytes_read <= 0) {
        is_connected = false;
        return "ERROR: Failed to receive response from joker server";
    }
    
    // Parse the response
    string response(buffer);
    size_t delimiter_pos = response.find('-');
    
    if (delimiter_pos == string::npos) {
        return "ERROR: Invalid response format";
    }
    
    string action = response.substr(0, delimiter_pos);
    string data = response.substr(delimiter_pos + 1);
    
    if (action != "AUDIENCE_RESULT") {
        return "ERROR: Unexpected response type";
    }
    
    // If response includes client ID, extract just the results part
    size_t client_colon_pos = data.find(':');
    if (client_colon_pos != string::npos) {
        data = data.substr(client_colon_pos + 1);
    }
    
    // Format the audience results for display
    string formatted_result = "Ask the Audience Results:\n";
    size_t pos = 0;
    string token;
    string delimiter = ",";
    int option_index = 0;
    char options[] = {'A', 'B', 'C', 'D'};
    
    while ((pos = data.find(delimiter)) != string::npos) {
        token = data.substr(0, pos);
        size_t option_colon_pos = token.find(':');
        if (option_colon_pos != string::npos) {
            string percentage = token.substr(option_colon_pos + 1);
            formatted_result += options[option_index] + ": " + percentage + " ";
        }
        data.erase(0, pos + delimiter.length());
        option_index++;
    }
    
    // Handle the last option
    size_t option_colon_pos = data.find(':');
    if (option_colon_pos != string::npos) {
        string percentage = data.substr(option_colon_pos + 1);
        formatted_result += options[option_index] + ": " + percentage;
    }
    
    return formatted_result;
}

string Joker::request_fifty_fifty(int question_index, char correct_answer, const string& clientId) {
    if (!is_connected) {
        if (!connect()) {
            return "ERROR: Not connected to joker server";
        }
    }
    
    // Format the request according to the protocol, including client ID if provided
    string request;
    if (clientId.empty()) {
        request = "FIFTY_FIFTY-" + to_string(question_index) + "," + correct_answer;
    } else {
        request = "FIFTY_FIFTY-" + clientId + ":" + to_string(question_index) + "," + correct_answer;
    }
    
    // Send the request
    send(sock, request.c_str(), request.length(), 0);
    
    // Receive the response
    char buffer[1024] = {0};
    int bytes_read = read(sock, buffer, sizeof(buffer));
    
    if (bytes_read <= 0) {
        is_connected = false;
        return "ERROR: Failed to receive response from joker server";
    }
    
    // Parse the response
    string response(buffer);
    size_t delimiter_pos = response.find('-');
    
    if (delimiter_pos == string::npos) {
        return "ERROR: Invalid response format";
    }
    
    string action = response.substr(0, delimiter_pos);
    string data = response.substr(delimiter_pos + 1);
    
    if (action != "FIFTY_FIFTY_RESULT") {
        return "ERROR: Unexpected response type";
    }
    
    // If response includes client ID, extract just the results part
    size_t colon_pos = data.find(':');
    if (colon_pos != string::npos) {
        data = data.substr(colon_pos + 1);
    }
    
    // Format the 50:50 results for display
    string formatted_result = "50:50 Result: Remaining options: ";
    
    // The data should be in the format "A,B" (two remaining options)
    formatted_result += data;
    
    return formatted_result;
}

// Register a client with the joker server
bool Joker::register_client(const string& clientId) {
    if (!is_connected) {
        if (!connect()) {
            return false;
        }
    }
    
    // Format the registration request
    string request = "REGISTER-" + clientId;
    
    // Send the request
    send(sock, request.c_str(), request.length(), 0);
    
    // Receive the response
    char buffer[1024] = {0};
    int bytes_read = read(sock, buffer, sizeof(buffer));
    
    if (bytes_read <= 0) {
        is_connected = false;
        return false;
    }
    
    // Parse the response to confirm registration
    string response(buffer);
    if (response.find("REGISTERED-") != string::npos) {
        cout << "Successfully registered client " << clientId << " with joker server" << endl;
        return true;
    }
    
    return false;
}

void Joker::close_connection() {
    if (is_connected) {
        close(sock);
        is_connected = false;
        cout << "Disconnected from joker server" << endl;
    }
}
