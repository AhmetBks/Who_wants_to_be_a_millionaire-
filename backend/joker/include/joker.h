#include <iostream>
#include <string>
#include <map>
#include "entry.h"

#ifndef JOKER_H 
#define JOKER_H

class Joker {
private:
    int m;
    int currentSize = 0; 
    static const int MAX_SIZE = 100;
    struct Entry map[MAX_SIZE];

public:
    Joker(int max_clients);
    void register_client(int client_socket, const char* value);
    std::string get_audience_results(int question_index);
    std::string get_fifty_fifty_options(int question_index, char correct_answer);
    void process_request(const std::string& request, int client_socket);
};

#endif
