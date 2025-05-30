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

👉 [Download Millionaire_Presentation.pptx](./presentation/Millionaire_Presentation.pptx)

## Game Screenshots

Here are some screenshots of the game in action:

### Game Interface
![Game Interface]![1](https://github.com/user-attachments/assets/8544c736-abe3-40b6-9b1c-a533336ccfcb)


### Question Screen
![Question Screen](![2](https://github.com/user-attachments/assets/f033debb-200f-429f-8e7b-d614f22dd98d)
)

### Correct Answer
![Jokers](.![3](https://github.com/user-attachments/assets/ca248427-1441-4c7a-adcc-0ed7ca03e7b6)
)


### Using Audience Jokers
![Jokers]![4](https://github.com/user-attachments/assets/c47d9d81-7087-460b-bbdf-08817e40b153)


### Using 50:50 Jokers
![Jokers](![5](https://github.com/user-attachments/assets/b41d1858-eb02-45aa-aada-1d33cc86139a)
)

### Winning Moment
![Winning Moment](![6](https://github.com/user-attachments/assets/af40569f-433b-4578-a573-4be71b23511c)
)

### Game Over Screen
![Game Over](![7](https://github.com/user-attachments/assets/53fc6997-c694-4a8d-9d4d-6a7fb19e5126)
)

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
