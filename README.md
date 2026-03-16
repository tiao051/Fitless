# Fitly

A fitness tracking app for workouts and nutrition.

## Quick Start

```bash
# Terminal 1: Start backend
docker-compose up -d --build

# Terminal 2: Start frontend
cd frontend/fitly-app
npm install
npm start
```

Then scan the QR code on your iPhone with Expo Go.

## Setup

### Prerequisites
- Node.js 18+ and npm
- Docker & Docker Compose
- Expo CLI
- iPhone with Expo Go app

### Running Services

```bash
# Start Docker containers (PostgreSQL + API)
docker-compose up -d --build
docker-compose ps
```

Services:
- **PostgreSQL**: port 5432
- **.NET API**: port 5062
- **Frontend (npm)**: port 8081

## Logs

All logs are written to your machine:

- **API logs**: `backend/logs/api/app.log`
- **Database logs**: `backend/logs/postgres/postgresql.log`
- **Frontend logs**: Terminal when running `npm start`

View logs:
```bash
# Windows PowerShell
Get-Content backend/logs/api/app.log -Wait
Get-Content backend/logs/postgres/postgresql.log -Wait

# Linux/Mac
tail -f backend/logs/api/app.log
tail -f backend/logs/postgres/postgresql.log
```

## Stop Services

```bash
docker-compose down
```

## Features

- User authentication with JWT
- Workout logging and tracking
- Nutrition tracking (1,636 pre-loaded foods)
- Daily summary and progress tracking

