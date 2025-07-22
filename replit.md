# TOTVS RM Authentication Service

## Overview

This is a full-stack web application designed specifically for authenticating with TOTVS RM systems. The application provides a clean, modern interface for users to log in to TOTVS RM servers and manage their authentication tokens. It features a React frontend with shadcn/ui components and an Express.js backend configured for future expansion.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

**Navigation System Overhaul**
- Implemented hierarchical sidebar navigation with responsive mobile support
- Restructured menu organization:
  - Moved "Parâmetros" to top-level menu alongside other main sections
  - Renamed "Gestão de Compras/Faturamento" to "Compras e Faturamento" for better display
  - Relocated token information to "Parâmetros > Informações do Token"
- Enhanced error messages with friendly text and collapsible technical details
- Added placeholder pages for modules in development with consistent messaging

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

- **Frontend**: React-based SPA using TypeScript and Vite for development
- **Backend**: Express.js server with TypeScript support
- **Database**: Configured for PostgreSQL with Drizzle ORM (ready for future database features)
- **Styling**: Tailwind CSS with shadcn/ui component system
- **Authentication**: Direct client-side authentication with TOTVS RM servers

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Library**: Comprehensive shadcn/ui component system with Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Development**: Hot reloading with tsx and Vite integration
- **Middleware**: JSON parsing, URL encoding, request logging

### Key Pages and Features
- **Login Page** (`/`): TOTVS RM authentication form with credential validation
- **Dashboard System** (`/dashboard/*`): Complete navigation system with sidebar menu
- **Navigation Structure**:
  - **Globais** (`/dashboard/globais`): Global system configurations
  - **Gestão Financeira**: Financial management with submenus for accounts payable/receivable and bank transactions
  - **Compras e Faturamento**: Purchase and billing management with detailed submenus
  - **Parâmetros** (`/dashboard/parametros/*`): System parameters including token information
- **Responsive Design**: Mobile-friendly sidebar with overlay navigation
- **Error Handling**: User-friendly error messages with technical details toggle

## Data Flow

1. **Authentication Flow**:
   - User enters TOTVS credentials on login page
   - Frontend validates input using Zod schemas
   - Direct authentication call to TOTVS RM server
   - Token stored in localStorage with user metadata
   - Redirect to dashboard on successful authentication

2. **Token Management**:
   - Automatic token validation on page load
   - Refresh token functionality for expired tokens
   - Secure token storage with expiration tracking
   - Logout functionality with token cleanup

3. **API Integration**:
   - Direct frontend-to-TOTVS communication (no proxy)
   - Comprehensive error handling for different HTTP status codes
   - Token copying and API endpoint management

## External Dependencies

### Core Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Components**: Extensive Radix UI primitive components
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack React Query
- **Validation**: Zod with Hookform resolvers
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **Icons**: Lucide React icon library

### Backend Dependencies
- **Server**: Express.js framework
- **Database**: Drizzle ORM with PostgreSQL support (@neondatabase/serverless)
- **Development**: tsx for TypeScript execution, esbuild for production builds
- **Session Management**: connect-pg-simple (prepared for future session handling)

### Development Tools
- **Build System**: Vite with React plugin
- **TypeScript**: Full type checking across frontend and backend
- **Replit Integration**: Custom plugins for development environment
- **PostCSS**: Tailwind CSS processing

## Deployment Strategy

The application is configured for multiple deployment scenarios:

- **Development**: Vite dev server with Express backend integration
- **Production**: Static build output with Express server for API endpoints
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Environment Variables**: DATABASE_URL for PostgreSQL connection
- **Asset Handling**: Vite manages client assets, Express serves API routes

### Database Strategy
- **ORM**: Drizzle configured with PostgreSQL dialect
- **Migrations**: Drizzle Kit for schema management
- **Schema**: Shared TypeScript schemas between frontend and backend
- **Storage**: Memory storage implementation ready for database upgrade

The architecture prioritizes type safety, developer experience, and scalability while maintaining a clean separation of concerns between authentication logic and potential future business features.