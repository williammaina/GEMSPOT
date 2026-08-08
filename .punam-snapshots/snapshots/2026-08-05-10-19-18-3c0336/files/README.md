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
MVC architecture

## 🏗️ Backend Architecture

GemSpot KE follows a **modular MVC-inspired architecture** built around Flask Blueprints.

The application separates request handling, validation, business logic, data persistence, and application configuration into dedicated layers. This makes the API easier to maintain, test, scale, and extend.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         🌐 CLIENT APPLICATION                                │
│                                                                              │
│   React SPA  ──────── JWT Authentication ──────── REST API Requests         │
│                                                                              │
│                   GET • POST • PATCH • DELETE                               │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       │  /api/*
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     🚀 FLASK APPLICATION LAYER                              │
│                                                                              │
│   main.py                                                                    │
│   └── create_app()                                                           │
│       ├── Load configuration                                                 │
│       ├── Initialize extensions                                              │
│       ├── Register API Blueprints                                            │
│       └── Configure error handlers                                           │
│                                                                              │
│   extensions.py                                                              │
│   └── db • ma • jwt • cors • migrate                                         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    🎮 CONTROLLER LAYER — C                                  │
│                                                                              │
│  auth_controller       user_controller       place_controller                │
│  event_controller      review_controller     favorite_controller             │
│  vibe_check_controller category_controller   admin_controller                │
│                                                                              │
│  Responsibilities:                                                           │
│  • Receive and route HTTP requests                                           │
│  • Apply authentication and authorization                                    │
│  • Coordinate application business logic                                     │
│  • Call schemas and database models                                          │
│  • Return standardized JSON responses                                        │
└───────────────────────┬──────────────────────┬───────────────────────────────┘
                        │                      │
                        │ validates            │ persists / retrieves
                        ▼                      ▼
┌─────────────────────────────────┐  ┌────────────────────────────────────────┐
│      🛡️ SCHEMA LAYER — V         │  │        🗄️ MODEL LAYER — M              │
│                                 │  │                                        │
│  user_schema.py                 │  │  user.py                               │
│  place_schema.py                │  │  place.py                              │
│  event_schema.py                │  │  event.py                              │
│  review_schema.py               │  │  review.py                             │
│  favorite_schema.py             │  │  favorite.py                           │
│  vibe_schema.py                 │  │  vibe_check.py                         │
│  category_schema.py             │  │  category.py                           │
│                                 │  │  place_tag.py                          │
│  Responsibilities:              │  │                                        │
│  • Validate request data        │  │  Responsibilities:                     │
│  • Serialize API responses      │  │  • Define database entities            │
│  • Deserialize request payloads │  │  • Define relationships                │
│  • Enforce data constraints     │  │  • Execute database operations         │
└─────────────────────────────────┘  └──────────────────────┬─────────────────┘
                                                            │
                                                            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         💾 DATA PERSISTENCE                                  │
│                                                                              │
│              SQLite — Development                                            │
│              PostgreSQL — Production                                         │
│                                                                              │
│              instance/  •  migrations/  •  Flask-Migrate                     │
└──────────────────────────────────────────────────────────────────────────────┘


        ┌──────────────────────────────────────────────────────────┐
        │                    SUPPORTING MODULES                     │
        │                                                          │
        │  utils/category_map.py                                   │
        │  └── Category slug ↔ database category mapping           │
        │                                                          │
        │  seed.py                                                 │
        │  └── Demo users, places, categories, events and tags     │
        └──────────────────────────────────────────────────────────┘
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
## 🔗 Database Relationships
ERD DIAGRAM
![alt text](image.png)

| 🧩 Parent Entity           | ➡️ Child Entity       | 🔢 Cardinality | 🎯 Relationship Purpose                                                                                                   |
| :------------------------- | :-------------------- | :------------: | :------------------------------------------------------------------------------------------------------------------------ |
| 👤 **User**                | ⭐ **Reviews**         |     `1 : N`    | A user can publish multiple ratings, written reviews, photos, and videos.                                                 |
| 👤 **User**                | ❤️ **Favorites**      |     `1 : N`    | A user can save multiple places and revisit them later.                                                                   |
| 👤 **User**                | 📡 **VibeChecks**     |     `1 : N`    | A user can submit multiple live crowd, atmosphere, and vibe updates.                                                      |
| 👤 **User**                | 🔖 **EventBookmarks** |     `1 : N`    | A user can bookmark multiple events they are interested in attending.                                                     |
| 🗂️ **Category**           | 📍 **Places**         |     `1 : N`    | A category can organize multiple destinations, including **Nature**, **Eats**, **Nightlife**, and **Action** experiences. |
| 🗂️ **Category**           | 📅 **Events**         |     `1 : N`    | A category can classify and organize multiple event listings.                                                             |
| 📍 **Place**               | ⭐ **Reviews**         |     `1 : N`    | A place can receive multiple community reviews. Related reviews are removed when the place is deleted.                    |
| 📍 **Place**               | 🖼️ **PlaceImages**   |     `1 : N`    | A place can contain a gallery of images that showcase the destination.                                                    |
| 📍 **Place**               | 📡 **VibeChecks**     |     `1 : N`    | A place can receive multiple real-time crowd and atmosphere reports.                                                      |
| 📍 **Place**               | ❤️ **Favorites**      |     `1 : N`    | A place can be saved by multiple users.                                                                                   |
| 📍 **Place**               | 📅 **Events**         |     `1 : N`    | A place may host multiple events. The `place_id` field is optional for events without a registered GemSpot location.      |
| 📍 **Place** ↔ 🏷️ **Tag** | 🔗 **PlaceTags**      |     `M : N`    | Places can have multiple tags, while each tag can be assigned to multiple places through the association table.           |
| 📅 **Event**               | 🔖 **EventBookmarks** |     `1 : N`    | An event can be bookmarked by multiple users.                                                                             |

> **Cardinality Guide:** `1 : N` means **one record can relate to many records**, while `M : N` means **many records can relate to many records** through an association table.

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

# 🚀 GemSpot KE — Backend API

> **Flask REST API powering the GemSpot KE frontend.**

GemSpot KE is a discovery-first lifestyle platform built to help users explore places, experiences, events, and hidden gems across Kenya. The backend provides secure authentication, place discovery, community reviews, live vibe updates, favorites, event bookmarking, category management, and administrative tools through a RESTful API.

---

## ✨ Quick Start

### 1. Navigate to the Backend

```bash
cd backend
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

### 3. Activate the Virtual Environment

**Linux / macOS**

```bash
source .venv/bin/activate
```

**Windows**

```powershell
.venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Initialize and Seed the Database

GemSpot KE uses **SQLite by default**. The database file, `gemspot.db`, is created in the current working directory.

```bash
export FLASK_APP=main.py

flask init-db
flask seed
```

> **Windows PowerShell**

```powershell
$env:FLASK_APP="main.py"

flask init-db
flask seed
```

### 6. Start the Development Server

```bash
python main.py
```

The API will be available at:

```text
http://0.0.0.0:5000
```

---

## 🐘 Production Configuration — PostgreSQL

For production, configure the application with a PostgreSQL database and secure environment variables.

```bash
export DATABASE_URL=postgresql://user:pass@host/dbname

export SECRET_KEY=your-production-secret-key

export JWT_SECRET_KEY=your-production-jwt-secret

gunicorn main:app
```

> ⚠️ Never commit production secrets, JWT keys, or database credentials to GitHub. Store them securely using environment variables or your deployment platform's secret manager.

---

## 🌐 Frontend Integration

The GemSpot KE React frontend communicates with the Flask API through the following environment variable:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Request Flow

```text
┌────────────────────┐
│  React Frontend    │
│       (SPA)        │
└─────────┬──────────┘
          │
          │ HTTP Requests + JWT
          ▼
┌────────────────────┐
│  Flask REST API    │
│  /api/* Routes     │
└─────────┬──────────┘
          │
          │ SQLAlchemy ORM
          ▼
┌────────────────────┐
│ SQLite / PostgreSQL│
└────────────────────┘
```

---

## 👥 Demo Accounts

After running:

```bash
flask seed
```

use the following accounts to access the seeded GemSpot KE environment:

| Account               | Email                 | Password         |   Role  |
| :-------------------- | :-------------------- | :--------------- | :-----: |
| 🛡️ **Administrator** | `admin@gemspot.co.ke` | `AdminPass2026!` | `admin` |
| 👤 **Demo User**      | `wanjiku@example.com` | `Password123!`   |  `user` |

> ⚠️ These credentials are intended for local development and demonstration only. Change or remove them before deploying the application publicly.

---

# 🧭 API Reference

All endpoints are prefixed with:

```text
/api
```

Protected endpoints require a valid JWT access token:

```http
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication

| Method | Endpoint             | Description                                                                                                                 |
| :----: | :------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/auth/register` | Register a new user. Soft-fills `name` into `first_name` and `last_name`, and can derive a username from the email address. |
| `POST` | `/api/auth/login`    | Authenticate a user and return `token`, `access_token`, and user information.                                               |
| `POST` | `/api/auth/logout`   | Log out the current user. JWT authentication is optional.                                                                   |
|  `GET` | `/api/auth/me`       | Retrieve the currently authenticated user. 🔒                                                                               |

---

## 👤 User Profile

|  Method | Endpoint        | Description                                   |
| :-----: | :-------------- | :-------------------------------------------- |
|  `GET`  | `/api/users/me` | Retrieve the authenticated user's profile. 🔒 |
| `PATCH` | `/api/users/me` | Update the authenticated user's profile. 🔒   |

---

## 📍 Places

|  Method  | Endpoint          | Description                                                                        |
| :------: | :---------------- | :--------------------------------------------------------------------------------- |
|   `GET`  | `/api/places`     | Browse and search places. Supports category and text search filters.               |
|   `GET`  | `/api/places/:id` | Retrieve detailed information for a specific place.                                |
|  `POST`  | `/api/places`     | Create a new place. Requires authentication and accepts frontend field aliases. 🔒 |
|   `PUT`  | `/api/places/:id` | Fully update a place from the administration dashboard. 🔒                         |
|  `PATCH` | `/api/places/:id` | Partially update an existing place. 🔒                                             |
| `DELETE` | `/api/places/:id` | Remove a place. 🔒                                                                 |

### Supported Place Filters

```http
GET /api/places?category=nature&q=hiking
```

Supported category slugs include:

```text
nature • eats • nightlife • action
```

---

## 📅 Events

|  Method  | Endpoint                     | Description                                         |
| :------: | :--------------------------- | :-------------------------------------------------- |
|   `GET`  | `/api/events`                | Browse and search available events.                 |
|   `GET`  | `/api/events/:id`            | Retrieve detailed information for a specific event. |
|  `POST`  | `/api/events`                | Create a new event. 🔒                              |
|   `PUT`  | `/api/events/:id`            | Fully update an event. 🔒                           |
|  `PATCH` | `/api/events/:id`            | Partially update an event. 🔒                       |
| `DELETE` | `/api/events/:id`            | Remove an event. 🔒                                 |
|  `POST`  | `/api/events/:id/bookmark`   | Add or remove an event bookmark. 🔒                 |
|   `GET`  | `/api/events/user/bookmarks` | Retrieve the current user's bookmarked events. 🔒   |

### Event Search

```http
GET /api/events?category=music&q=festival
```

---

## ⭐ Community Reviews

| Method | Endpoint                 | Description                                                 |
| :----: | :----------------------- | :---------------------------------------------------------- |
|  `GET` | `/api/reviews`           | Retrieve reviews. Supports filtering by `place_id`.         |
| `POST` | `/api/reviews`           | Create a review using `{ place_id, rating, ... }`. 🔒       |
|  `GET` | `/api/reviews/place/:id` | Retrieve reviews for a place using the legacy nested route. |
| `POST` | `/api/reviews/place/:id` | Create a review using the legacy nested route. 🔒           |

### Example

```http
GET /api/reviews?place_id=1
```

---

## 📡 Live Vibe Checks

Vibe Checks provide community-generated information about crowd levels, atmosphere, and current conditions at a place.

| Method | Endpoint               | Description                                         |
| :----: | :--------------------- | :-------------------------------------------------- |
|  `GET` | `/api/vibes`           | Retrieve the latest vibe checks across GemSpot KE.  |
|  `GET` | `/api/vibes/reels`     | Retrieve vibe checks containing video content only. |
|  `GET` | `/api/vibes/place/:id` | Retrieve vibe checks for a specific place.          |
| `POST` | `/api/vibes/place/:id` | Submit a live vibe update for a place. 🔒           |

---

## ❤️ Favorites

|  Method  | Endpoint                   | Description                                          |
| :------: | :------------------------- | :--------------------------------------------------- |
|   `GET`  | `/api/favorites`           | Retrieve the authenticated user's saved places. 🔒   |
|  `POST`  | `/api/favorites`           | Save or toggle a place using `{ "place_id": 1 }`. 🔒 |
| `DELETE` | `/api/favorites/:place_id` | Remove a place from the user's favorites. 🔒         |

---

## 🗂️ Categories

| Method | Endpoint          | Description                                            |
| :----: | :---------------- | :----------------------------------------------------- |
|  `GET` | `/api/categories` | Retrieve all available place and discovery categories. |

---

## 🛡️ Administration

Administrative endpoints require an authenticated user with administrator privileges.

|  Method | Endpoint                       | Description                                           |
| :-----: | :----------------------------- | :---------------------------------------------------- |
|  `GET`  | `/api/admin`                   | Retrieve administrative dashboard statistics. 🛡️     |
|  `GET`  | `/api/admin/users`             | Retrieve users for administration and moderation. 🛡️ |
| `PATCH` | `/api/admin/places/:id/verify` | Toggle the verification status of a place. 🛡️        |

---

## 🔑 Access Legend

| Symbol | Meaning                                      |
| :----: | :------------------------------------------- |
|   🌐   | Public endpoint — no authentication required |
|   🔒   | Authenticated user — valid JWT required      |
|   🛡️  | Administrator — valid admin JWT required     |

---

# 🧩 Backend Model Enhancements

The current GemSpot KE backend expands on the earlier implementation with richer discovery data, complete administration workflows, and stronger frontend compatibility.

## 📍 Enhanced Place Model

The `Place` model supports detailed, category-specific discovery information.

### Nature & Action

```text
activities
requirements
what_to_bring
best_time
difficulty
```

### Eats & Dining

```text
menu_highlights
dietary
```

### Nightlife

```text
music_vibe
signature_drinks
peak_hours
cover_charge
```

### Additional Improvements

* JSON support for flexible category-specific information
* Free-text parking information
* M-Pesa availability and till number support
* Reservation requirements
* Indoor and outdoor location details
* Pet-friendly information
* Power socket availability
* `updated_at` timestamps
* Improved logistics and destination information

---

## 📅 Enhanced Event Model

The `Event` model includes:

```text
host_name
host_org
going_count
tags
updated_at
```

Additional event capabilities include:

* Optional place association
* Category classification
* Google Calendar links
* Event banners
* Ticket pricing
* Event status management
* User bookmarking
* Full administration support

---

## 🔄 CRUD and API Improvements

The backend now includes:

* Full **Create, Read, Update, and Delete** support for places
* Full **Create, Read, Update, and Delete** support for events
* `PUT` and `PATCH` support for administration workflows
* `DELETE` support for content management
* Review routes supporting both collection and nested-place patterns
* Vibe routes supporting both collection and nested-place patterns
* Frontend category slug resolution during place creation and updates
* Support for frontend field aliases
* Seed data aligned with the curated frontend catalog

---

## 🏷️ Frontend Category Compatibility

The backend accepts frontend-friendly category slugs during place creation and updates:

```text
nature
eats
nightlife
action
```

These values are resolved to their corresponding database categories before data is persisted.

```text
React Frontend Category Slug
             │
             ▼
     category_map.py
             │
             ▼
   Database Category
             │
             ▼
      Place Record
```

---

## 🌱 Seed Data

The `flask seed` command creates a development catalog containing:

* Demo administrator and user accounts
* Curated place listings
* Place categories
* Discovery tags
* Event listings
* Community content

The seed data is designed to mirror the GemSpot KE frontend catalog and provide a functional environment immediately after setup.

---

## 🛠️ Development Commands

| Command             | Purpose                                                  |
| :------------------ | :------------------------------------------------------- |
| `flask init-db`     | Create and initialize the application database           |
| `flask seed`        | Populate the database with GemSpot KE demonstration data |
| `python main.py`    | Start the Flask development server                       |
| `gunicorn main:app` | Start the application using Gunicorn                     |

---

## 📌 API Design Principles

The GemSpot KE API is designed around:

* RESTful resource-based endpoints
* JWT-based stateless authentication
* Consistent JSON request and response formats
* Frontend-compatible field aliases
* Flexible category-specific data
* Modular Flask Blueprints
* Clear separation of controllers, schemas, and models
* SQLite development support
* PostgreSQL production readiness

---


**Built for discovering Kenya, one gem at a time. 🇰🇪**

GemSpot KE Backend API • Flask • SQLAlchemy • JWT • SQLite • PostgreSQL


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