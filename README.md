# GemSpot KE API

<div align="center">

# 🇰🇪 GemSpot KE — Backend API

**A Discovery-First Urban Lifestyle Platform for Kenya**

RESTful backend powering intelligent discovery of places, experiences, events, and community-driven recommendations across Kenya.

Built with **Flask**, **PostgreSQL**, **SQLAlchemy**, and **JWT Authentication**.

</div>

---

# Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Modules](#api-modules)
- [Authentication](#authentication)
- [Core Functionalities](#core-functionalities)
- [Security Features](#security-features)
- [Future Improvements](#future-improvements)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

# Overview

GemSpot KE is a **discovery-first urban lifestyle platform** built specifically for Kenya.

Unlike traditional mapping applications that primarily focus on navigation, GemSpot KE helps users discover restaurants, cafés, adventures, entertainment venues, attractions, nightlife, events, and hidden gems using localized intelligence.

The backend exposes a secure RESTful API consumed by the React frontend and is responsible for:

- User authentication
- Business logic
- Search and filtering
- Recommendation services
- Reviews
- Favorites
- Event management
- Real-time vibe updates
- Administrative moderation

---

# Problem Statement

Planning an outing in Kenya typically requires switching between multiple platforms:

- Google Maps
- TikTok
- Instagram
- Facebook Events
- WhatsApp Groups
- Restaurant Pages
- Travel Blogs

Even after all this searching, users still lack information such as:

- Parking availability
- M-Pesa acceptance
- Crowd levels
- Estimated spending
- Wi-Fi availability
- Safety
- Reservations
- Weather conditions
- Best visiting hours

GemSpot KE centralizes this information into one intelligent discovery platform.

---

# Solution

GemSpot KE combines:

- Location discovery
- Community reviews
- Budget intelligence
- Local logistics
- Event discovery
- Weather awareness
- Live crowd updates

into one unified ecosystem designed specifically around how Kenyans explore, socialize and travel.

---

# Key Features

## Authentication

- User Registration
- Secure Login
- JWT Authentication
- Password Hashing (bcrypt)
- Password Reset
- Protected Routes
- Role-Based Authorization

---

## Place Discovery

Users can:

- Search destinations
- Browse categories
- Filter by county
- Filter by town
- Filter by budget
- Filter by cuisine
- Filter by vibe
- Filter by amenities
- Discover nearby places
- View logistics information

---

## Reviews

Users can

- Rate places
- Upload photos
- Upload videos
- Leave reviews
- Edit reviews
- Delete reviews

---

## Favorites

Users can

- Save places
- Remove favorites
- View bookmarked locations

---

## Events

Users can

- Browse events
- Save events
- View upcoming events
- Add events to Google Calendar

---

## Live Vibe Check

Community members can report

- Quiet
- Moderate
- Busy
- Packed
- Closed

alongside weather conditions to help others make informed decisions.

---

## Administrative Dashboard

Administrators can

- Verify businesses
- Moderate reviews
- Approve listings
- Publish events
- Manage categories
- Manage users
- Moderate Vibe Checks

---

# Technology Stack

## Backend

- Python 3
- Flask
- Flask RESTful
- Flask SQLAlchemy
- Flask JWT Extended
- Flask Marshmallow
- Flask Migrate
- Flask CORS

---

## Database

- PostgreSQL (Production)
- SQLite (Development)

---

## Authentication

- JWT Tokens
- bcrypt Password Hashing

---

## External APIs

- Mapbox API
- OpenWeather API
- Google Calendar API
- Google OAuth
- Geolocation API

---

## Deployment

- Gunicorn
- GitHub Actions
- Render
- Railway
- Docker (Future)

---

# Project Architecture

GemSpot KE follows the MVC architectural pattern.

```
                React Frontend
                      │
                 Axios Requests
                      │
             Flask RESTful API
                      │
        ┌─────────────┼─────────────┐
        │             │             │
 Authentication    Discovery    Recommendations
        │             │             │
        └─────────────┼─────────────┘
                      │
               PostgreSQL Database
                      │
     Mapbox │ Weather │ Google Calendar
```

---

# Database Design

The backend is built around the following core entities:

- Users
- Places
- Categories
- Tags
- Reviews
- Favorites
- Events
- Event Bookmarks
- Vibe Checks
- Place Images

### Relationships

```
User
 ├── Reviews
 ├── Favorites
 ├── Vibe Checks
 └── Event Bookmarks

Category
 └── Places

Place
 ├── Reviews
 ├── Images
 ├── Events
 ├── Favorites
 ├── Vibe Checks
 └── Tags

Event
 └── Bookmarks
```

---

# Project Structure

```
gemspot-backend/

controllers/
models/
schemas/
migrations/

extensions.py
main.py
requirements.txt
README.md
```

Each layer has a clear responsibility.

### Controllers

Business logic and API endpoints.

### Models

Database schema using SQLAlchemy.

### Schemas

Validation and serialization using Marshmallow.

### Extensions

Application-wide singleton instances.

### Migrations

Database version control.

---

# Installation

Clone the repository

```bash
git clone https://github.com/yourusername/gemspot-backend.git

cd gemspot-backend
```

Create a virtual environment

```bash
python -m venv venv
```

Activate it

Linux / macOS

```bash
source venv/bin/activate
```

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

# Environment Variables

Create a `.env` file

```
SECRET_KEY=

JWT_SECRET_KEY=

DATABASE_URL=

MAPBOX_API_KEY=

OPENWEATHER_API_KEY=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

FLASK_ENV=development
```

---

# Running the Application

Initialize migrations

```bash
flask db init
```

Generate migration

```bash
flask db migrate
```

Apply migration

```bash
flask db upgrade
```

Run server

```bash
flask run
```

or

```bash
python main.py
```

---

# API Modules

## Authentication

```
POST   /auth/register

POST   /auth/login

POST   /auth/logout

POST   /auth/reset-password
```

---

## Users

```
GET    /users/profile

PUT    /users/profile

PATCH  /users/avatar
```

---

## Places

```
GET    /places

GET    /places/<id>

POST   /places

PATCH  /places/<id>

DELETE /places/<id>
```

---

## Reviews

```
GET

POST

PATCH

DELETE
```

---

## Favorites

```
GET

POST

DELETE
```

---

## Events

```
GET

POST

PATCH

DELETE
```

---

## Categories

```
GET

POST

PATCH

DELETE
```

---

## Vibe Checks

```
GET

POST
```

---

## Admin

```
Verify Listings

Moderate Reviews

Approve Events

Manage Users
```

---

# Authentication

GemSpot KE uses JWT Authentication.

Protected endpoints require

```
Authorization

Bearer <JWT Token>
```

Passwords are never stored in plaintext and are securely hashed using bcrypt before persistence.

---

# Core Functionalities

- Intelligent Search
- Budget-Based Filtering
- Nearby Discovery
- Event Discovery
- Community Reviews
- Photo Uploads
- Video Uploads
- Favorites
- Live Crowd Reports
- Weather Integration
- Google Calendar Integration
- Personalized Recommendations
- Verified Listings
- Administrative Moderation

---

# Security Features

- JWT Authentication
- bcrypt Password Hashing
- SQL Injection Protection
- CSRF Protection
- XSS Protection
- Input Validation
- Role-Based Access Control
- Environment Variable Secrets
- CORS Configuration

---

# Future Improvements

- AI-powered recommendations
- Push notifications
- Business analytics dashboard
- Premium business listings
- Recommendation engine
- Machine learning personalization
- Redis caching
- Elasticsearch
- WebSockets for live crowd updates
- Mobile API versioning

---

# Deployment

Production deployment supports

- Render
- Railway
- AWS
- DigitalOcean

Recommended production stack

```
Gunicorn

PostgreSQL

Nginx

GitHub Actions

HTTPS
```

---

# Contributing

Contributions are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

# License

This project is intended for educational and portfolio purposes.

© 2026 GemSpot KE

Built with ❤️ in Kenya.