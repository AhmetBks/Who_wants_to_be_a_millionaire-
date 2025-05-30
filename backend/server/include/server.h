#ifndef SERVER_H 
#define SERVER_H
#include <string>
#include <netinet/in.h>
#include "joker.h"

class Server {
private:
    int p;  
    int server_fd, new_socket;
    struct sockaddr_in address;
    
public:
    Server(int port);
    void setJokerClient(Joker* joker);
    void start();
    void handle_client(int client_socket);
    std::string process_audience_joker(int question_index, const std::string& clientId = "");
    std::string process_fifty_fifty_joker(int question_index, std::string correct_answer, const std::string& clientId = "");
};

#endif
