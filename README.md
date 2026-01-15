# Operations Control Panel

A production-grade, standalone web application skeleton for operations management systems.

## Overview

This platform provides a foundational architecture for building comprehensive operations control systems. It features:

- **Apple-grade UI/UX** - Premium, minimal, and highly polished interface
- **Theme System** - Light, Dark, and System preference with smooth transitions
- **Authentication** - JWT-based with refresh tokens
- **RBAC** - Role-based access control with granular permissions
- **Modular Architecture** - Clean separation of concerns with extensible module system

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- React Router v6 for routing
- TailwindCSS with custom design tokens
- Lucide React for icons

### Backend
- Node.js with TypeScript
- NestJS framework
- REST API (versioned at `/api/v1`)
- OpenAPI/Swagger documentation
- JWT authentication with refresh tokens

### Database
- PostgreSQL
- Prisma ORM
- Migration-based schema management

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended) or npm

### Development Setup

1. **Clone and install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   pnpm install

   # Install frontend dependencies
   cd ../frontend
   pnpm install
   ```

2. **Configure environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit .env with your database credentials

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Setup database**
   ```bash
   cd backend
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   pnpm dev

   # Terminal 2 - Frontend
   cd frontend
   pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000/api/v1
   - Swagger: http://localhost:3000/api/docs

### Docker Setup

```bash
docker-compose up -d
```

## Project Structure

```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (auth, theme)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   ├── styles/           # Global styles and tokens
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Utility functions
│   └── ...
├── backend/                  # NestJS backend application
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   ├── common/           # Shared utilities
│   │   └── config/           # Configuration
│   ├── prisma/               # Database schema and migrations
│   └── ...
├── docs/                     # Documentation
│   ├── deployment/           # AWS deployment guides
│   ├── features/             # Feature implementation docs
│   └── internal/             # Internal docs and guides
└── docker-compose.yml        # Docker configuration
```

## Module Placeholders

The following modules are stubbed and ready for implementation:

- Dashboard
- Administration
- Operations
- Production Tracking
- Costing
- Inventory & Warehousing
- Assets & Maintenance
- Logistics & Transport
- Customers & Sales
- Reporting & Analytics

## Default Credentials

After seeding, use these credentials:
- **Email**: admin@example.com
- **Password**: Admin123!

## Documentation

Project documentation is organized in the `docs/` folder:
- **deployment/** - AWS EC2 deployment guides
- **features/** - Feature implementation status docs
- **internal/** - Admin guides and internal documentation

## License

Proprietary - All rights reserved
