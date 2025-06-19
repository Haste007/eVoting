# E-Voting Platform

A full-stack electronic voting platform with authentication, backend API, and frontend interface.

## Project Structure

```
eVoting/
  authentication/      # Python FastAPI authentication server
  backend/             # Go Fiber backend API server
  database/            # SQL schema and seed data
  frontend/            # Vite + React frontend
  Images/              # Party logos and other images
  docker-compose.yml   # Docker Compose for Postgres
  rebuild_auth_server.sh # Script to rebuild authentication server container
```

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- [Go](https://golang.org/) (for backend development)
- [Node.js](https://nodejs.org/) (for frontend development)

## Setup Instructions

### 1. Configure Environment Variables

#### Backend

Create a `.env` file in `backend/` with your configuration. Example:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=fyp_user
DB_PASSWORD=fyp_password
DB_NAME=fyp_db
JWT_SECRET=your_jwt_secret
```

#### Frontend

Create a `.env` file in `frontend/` with your configuration. Example:

```
VITE_API_URL=http://localhost:5000
VITE_AUTH_URL=http://localhost:8000
```

### 2. Start PostgreSQL with Docker Compose

From the `eVoting/` directory, run:

```sh
docker-compose up -d
```

This will start a Postgres database and initialize it with the provided SQL files.

### 3. Build and Run the Authentication Server

Use the provided script to build and run the authentication server in Docker:

```sh
./rebuild_auth_server.sh
```

This will build the Docker image and start the container on port 8000.

### 4. Run the Backend API

From the `backend/` directory:

```sh
go run main.go
```

The backend will start on port 5000.

### 5. Run the Frontend

From the `frontend/` directory:

```sh
npm install
npm run dev
```

The frontend will start on port 5173 (default Vite port).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.