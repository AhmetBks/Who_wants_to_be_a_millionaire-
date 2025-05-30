#ifndef SERVER_H 
#define SERVER_H
#include "joker.h"
#include <netinet/in.h> // Add this include for sockaddr_in

class Server {
private:
    int p;  
    int server_fd, new_socket;
    struct sockaddr_in address;
    
public:
    Server(int port);
    void setJokerService(Joker* joker);
    void start();
    void handle_client(int client_socket);
};

#endif
