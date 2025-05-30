#ifndef JOKER_H 
#define JOKER_H

#include <string>
#include <netinet/in.h> // Add this include for sockaddr_in

class Joker {
private:
    int p; 
    std::string h;
    int sock = 0;
    struct sockaddr_in serv_addr;
    
public:
    bool is_connected = false;
    Joker(std::string host, int port);
    bool connect();
    std::string request_audience_help(int question_index, const std::string& clientId = "");
    std::string request_fifty_fifty(int question_index, char correct_answer, const std::string& clientId = "");
    std::string get_available_jokers(const std::string& clientId = "");
    bool register_client(const std::string& clientId);
    void close_connection();
};

#endif
