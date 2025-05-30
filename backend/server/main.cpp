#include <iostream>
#include "include/server.h"
#include "include/joker.h"
#include <thread>

using namespace std;

#define SERVER_PORT 4337
#define JOKER_PORT 4338
#define JOKER_HOST "127.0.0.1"

int main() {
    // Create the joker client
    Joker* joker = new Joker(JOKER_HOST, JOKER_PORT);
    
    // Create the game server and set the joker client
    Server server(SERVER_PORT);
    server.setJokerClient(joker);
    
    cout << "Game Host server started on port " << SERVER_PORT << endl;
    cout << "Will connect to Joker service on " << JOKER_HOST << ":" << JOKER_PORT << endl;
    
    // Start the server (this will block until the server is stopped)
    server.start();
    
    // Clean up (will never be reached in the current implementation)
    delete joker;
    
    return 0;
}
