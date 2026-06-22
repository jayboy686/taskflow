[README.md](https://github.com/user-attachments/files/29190484/README.md)
# Taskflow

Simple task management for your projects — a Trello-style kanban board built with Next.js.

## Features

- **User authentication** — Register and log in with email/password (NextAuth.js with credentials provider)
- **Boards** — Create, view, and delete project boards
- **Columns** — Organize work into customizable stages (To Do, In Progress, Done, etc.)
- **Cards** — Add tasks with title, description, and assignee
- **Card editing** — Inline modal to update card details
- **Responsive** — Tailwind CSS, works on desktop and mobile

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/) ORM
- [PostgreSQL](https://www.postgresql.org/)
- [NextAuth.js v4](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Docker](https://www.docker.com/) (for local PostgreSQL)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for local database)
- npm

### Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd taskflow

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env — generate a NEXTAUTH_SECRET:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Start PostgreSQL
docker compose up -d

# 5. Run database migrations
npx prisma migrate dev

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Compose

The included `docker-compose.yml` spins up a PostgreSQL 16 instance:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow
      POSTGRES_DB: taskflow
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
```

## Project Structure

```
taskflow/
├── app/                    # Next.js App Router
│   ├── api/                # REST API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── boards/         # Board CRUD
│   │   ├── cards/          # Card CRUD
│   │   └── columns/        # Column CRUD (+ card reordering)
│   ├── board/[id]/         # Board detail (kanban view)
│   ├── dashboard/          # User's board list
│   ├── login/              # Sign in page
│   ├── register/           # Sign up page
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Landing page
├── lib/                    # Shared utilities
│   ├── auth.ts             # NextAuth configuration
│   ├── auth-helpers.ts     # Auth helper functions
│   └── prisma.ts           # Prisma client singleton
├── prisma/
│   └── schema.prisma       # Database schema
├── docker-compose.yml      # Local PostgreSQL
├── Dockerfile              # App container
└── tailwind.config.js
```

## Database Schema

- **User** — Registered users (email, password, role)
- **Board** — Project boards belonging to a user
- **Column** — Ordered columns within a board
- **Card** — Tasks within a column, with optional title, description, assignee, and due date

## API Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/auth/register` | Create account |
| GET | `/api/boards` | List user's boards |
| POST | `/api/boards` | Create a board |
| GET | `/api/boards/[id]` | Get board details |
| DELETE | `/api/boards/[id]` | Delete a board |
| GET | `/api/boards/[id]/columns` | List columns for a board |
| POST | `/api/boards/[id]/columns` | Create a column |
| DELETE | `/api/columns/[columnId]` | Delete a column |
| GET | `/api/columns/[columnId]/cards` | List cards in a column |
| POST | `/api/columns/[columnId]/cards` | Create a card |
| PATCH | `/api/cards/[id]` | Update a card |
| DELETE | `/api/cards/[id]` | Delete a card |
| POST | `/api/columns/[columnId]/cards/reorder` | Reorder cards |

## Deployment

Build the Docker image:

```bash
docker build -t taskflow .
```

Set `DATABASE_URL` and `NEXTAUTH_URL` to your production values before deploying. The app is designed to run on platforms like Railway, Render, or Fly.io.

## License

MIT
