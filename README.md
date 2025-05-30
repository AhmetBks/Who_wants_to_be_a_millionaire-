# Who Wants to Be a Millionaire Game

This repository contains a "Who Wants to Be a Millionaire" game implementation with a backend written in C++ and a frontend built with Next.js.

## Project Overview

This project is a digital version of the popular TV quiz show "Who Wants to Be a Millionaire". It features:

- A C++ backend game server
- A Node.js adapter layer
- A modern Next.js frontend
- Docker containerization for easy deployment

## Architecture

The application is structured as a three-tier architecture:

1. **Backend**: Written in C++, handles game logic and question management
2. **Adapter**: Node.js service that facilitates communication between frontend and backend
3. **Frontend**: Next.js application that provides the user interface

## Project Presentation

The project includes a detailed presentation:

👉 [Milyoner_presentation.pptx](https://github.com/user-attachments/files/20525847/Milyoner_presentation.pptx)


## Game Screenshots

Here are some screenshots of the game in action:

### Game Interface
![1](https://github.com/user-attachments/assets/e1ddaddf-9805-4f80-9a11-700b08cf395b)



### Question Screen

![2](https://github.com/user-attachments/assets/77eda750-7ad4-4a5f-83b1-d337fa13e183)


### Correct Answer
![3](https://github.com/user-attachments/assets/9c245f9f-2f78-4785-b35a-c27268159cea)



### Using Audience Jokers
![4](https://github.com/user-attachments/assets/7572d8b9-32bd-4d24-85d3-e0ee5a4a20ae)


### Using 50:50 Jokers
![5](https://github.com/user-attachments/assets/9151d063-4db3-4261-b32e-66d9d76090f4)


### Winning Moment
![6](https://github.com/user-attachments/assets/0404b0fd-b191-4307-b7b2-8f69d54e6256)



### Game Over Screen
![7](https://github.com/user-attachments/assets/648f773e-c4aa-49e2-89dd-c0688d015f4d)



## Getting Started

### Prerequisites

- Docker and Docker Compose

### Running the Application

1. Clone this repository
2. Run the following command (if you have linux):

```bash
./start_all.sh
```

Alternatively, you can build and run the containers manually:

```bash
docker compose up --build
```

3. Access the game at: http://localhost:3000

## Project Structure

- `backend/`: C++ server implementation
  - `common/`: Shared libraries and utilities
  - `host/`: Game host service
  - `joker/`: Joker service implementation
  - `data/`: Game questions and data
- `frontend/`: Next.js application
  - `src/adapter/`: Node.js adapter service
  - `src/components/`: React components
  - `src/context/`: React context providers
  - `public/sounds/`: Game sound effects

## License

This project is for educational purposes.
