#include <iostream>
#include "include/server.h"
#include "include/joker.h"

using namespace std;

#define SERVER_PORT 4338
#define MAX_CLIENTS 10

int main() {
    // Create the joker service
    Joker* joker = new Joker(MAX_CLIENTS);
    
    // Create the server and set the joker service
    Server server(SERVER_PORT);
    server.setJokerService(joker);
    
    cout << "Joker Service started on port " << SERVER_PORT << endl;
    
    // Start the server (this will block until the server is stopped)
    server.start();
    
    // Clean up (this will never be reached in the current implementation)
    delete joker;
    
    return 0;
}
