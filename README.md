# Fitly

A fitness tracking app for workouts and nutrition.

## Core Features (MVP)

- User authentication
- Workout logging
- Basic progress tracking
- Simple nutrition tracking
- Leaderboard
- Feed and social sharing
- Progress tracking with body metrics and time-lapse transformations
- Account management and streak system
- Smart notifications
- Wearable device synchronization

## Features in Development

### Leaderboard
- Rank users by streak, volume, or challenge points within the community

### Feed and Social Sharing
- Share workout photos, recipes, and personal achievements

### Progress Tracking
- Body transformation time-lapse videos created from body photos (front/side/back)
- Weekly/monthly compilation of photos to visualize changes
- Body metrics tracking: weight, BMI, body fat percentage, and measurements

### Core Platform Features
- Account system with multi-provider login (Google, Apple ID, Facebook, Email)
- Streak system: consecutive-day counter for motivation
- Smart notifications: reminders for workouts, water intake, and meals based on user schedule
- Wearable sync: integration with Apple Health, Google Fit, and Garmin for step count, heart rate, and sleep data

## Tech Stack

- Frontend: React Native with Expo
- Backend: .NET 9
- Database: PostgreSQL
- Authentication: JWT

## Getting Started

### Frontend
```bash
cd frontend/fitly-app
npm install
npm start
```

### Backend
```bash
cd backend/Fitly.API
dotnet run
```