# 🌿 Community Space

A full-stack **Virtual Community Space** application — discover and create local events on an interactive map.

```
| Layer      | Stack                                                   |
|------------|---------------------------------------------------------|
| Frontend   | React 18+Vite+Tailwind CSS+React-Leaflet+TanStack Query |
| Backend    | Node.js + Express                                       |
| Database   | PostgreSQL (with optional PostGIS for spatial queries)  |
| Auth       | JWT (Bearer token)                                      |
```

---

## Project Structure

```
community-space/
├── client/                     # React frontend
│   ├── src/
│   │   ├── api/                # Axios client + API helpers
│   │   │   ├── client.js       # Axios singleton
│   │   │   └── events.js       # Event API calls
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Map.jsx         # React-Leaflet map with custom markers
│   │   │   ├── EventCard.jsx
│   │   │   ├── EventModal.jsx  # Detail + RSVP modal
│   │   │   └── CreateEventForm.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # JWT auth state
│   │   ├── hooks/
│   │   │   ├── useGeolocation.js
│   │   │   └── useEvents.js    # TanStack Query hooks
│   │   └── pages/
│   │       ├── Home.jsx        # Split map + sidebar view
│   │       ├── Events.jsx      # Full list + filters
│   │       ├── EventDetail.jsx # Single event page
│   │       ├── CreateEvent.jsx
│   │       ├── EditEvent.jsx
│   │       ├── Profile.jsx
│   │       ├── Login.jsx
│   │       └── Register.jsx
│   └── ...config files
│
└── server/                     # Express backend
    ├── controllers/
    │   ├── eventController.js  # Full CRUD + RSVP
    │   └── userController.js   # Register / login / profile
    ├── db/
    │   ├── index.js            # pg Pool
    │   └── migrate.js          # Schema runner
    ├── middleware/
    │   └── auth.js             # JWT protect / optionalAuth
    ├── models/
    │   └── dbSchema.sql        # Tables: users, events, rsvps
    ├── routes/
    │   └── api.js              # All routes with validation
    └── server.js               # Express entry point
```

---

## Quick Start

### 1. Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14

### 2. Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE community_space;"

# Apply the schema
psql -U postgres -d community_space -f server/models/dbSchema.sql
```

### 3. Server

```bash
cd server
npm install

# Copy and fill in your values
cp .env.example .env

npm run dev      # starts on http://localhost:5000
```

**Required `.env` values:**

```
| Variable
|
| `DATABASE_URL` | `postgresql://postgres:pw@localhost/community_space`|
| `JWT_SECRET`   | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `PORT`         | `5000`                                              |
| `CLIENT_ORIGIN | `http://localhost:5173`                             |
```

### 4. Client

```bash
cd client
npm install
npm run dev     # starts on http://localhost:5173
```
 
The Vite dev server proxies `/api/*` requests to `localhost:5000` automatically.
 
---
 
## API Reference
 
### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | — | Register new user |
| POST | `/api/users/login` | — | Login, returns JWT |
| GET | `/api/users/me` | ✅ | Get current user |
| PUT | `/api/users/me` | ✅ | Update bio / avatar |
| GET | `/api/users/:id/events` | — | User's hosted events |
 
### Events
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | optional | List events (filterable) |
| POST | `/api/events` | ✅ | Create event |
| GET | `/api/events/:id` | optional | Get event + attendees |
| PUT | `/api/events/:id` | ✅ | Update (organiser only) |
| DELETE | `/api/events/:id` | ✅ | Delete (organiser only) |
 
#### GET /api/events query params
| Param | Description |
|-------|-------------|
| `lat`, `lng` | Center for proximity search |
| `radius` | Radius in km (default 25) |
| `category` | Filter by category |
| `from`, `to` | ISO date range |
| `limit`, `offset` | Pagination |
 
### RSVPs
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events/:id/rsvp` | ✅ | Get my RSVP |
| POST | `/api/events/:id/rsvp` | ✅ | RSVP (`going`/`interested`) |
| DELETE | `/api/events/:id/rsvp` | ✅ | Cancel RSVP |
 
---
 
## Deployment (Render)
 
1. **Database** → Create a Render PostgreSQL instance; copy the `DATABASE_URL`.
2. **Backend** → New Web Service from the `server/` folder, build command `npm install`, start command `npm start`.
3. **Frontend** → New Static Site from the `client/` folder, build command `npm run build`, publish dir `dist`.  
   Set the `VITE_API_URL` env var if you move away from the Vite proxy (update `client.js` baseURL).
---
 
## Future Improvements
 
- [ ] PostGIS extension for true geodistance indexing
- [ ] Image upload via Cloudinary / S3
- [ ] Real-time attendee updates via WebSocket
- [ ] Email notifications on RSVP
- [ ] Social sharing cards (Open Graph)