# FRESCOO Admin Dashboard

Production-grade admin dashboard for **FRESCOO** food manufacturing — ingredient cost management and recipe costing.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Express 5, TypeScript, Prisma ORM 6 |
| Database | PostgreSQL 16 |
| Styling | Vanilla CSS (dark/light theme) |

## Project Structure

```
├── docker-compose.yml          # PostgreSQL container
├── backend/                    # Express API server
│   ├── prisma/schema.prisma    # Database schema
│   └── src/                    # Routes, services, validators
└── frontend/                   # Next.js App Router
    ├── app/(dashboard)/        # All dashboard pages
    ├── components/             # Reusable UI components
    └── providers/              # Theme & Toast providers
```

## Setup

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL)

### 1. Start Database
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
Backend runs at `http://localhost:4000`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`

### 4. View Database (optional)
```bash
cd backend
npx prisma studio
```
Opens at `http://localhost:5555`

## Features

- **Ingredient CRUD** — Create, edit, delete with category filtering
- **Recipe Builder** — Dynamic ingredient builder with real-time cost calculation
- **Cost Snapshots** — Historical cost preservation per recipe
- **Cost Breakdown** — Per-ingredient percentage distribution
- **Recalculate Costs** — Update recipe costs to current ingredient prices
- **Dark/Light Theme** — Toggle with localStorage persistence
- **Responsive Design** — Sidebar collapses on mobile

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://frescoo:frescoo_secret@localhost:5432/frescoo_db
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
SKIP_AUTH=true
NEXTAUTH_SECRET=your-secret-key
```

### Frontend
Uses `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api`)
