# WattWatch - Energy Consumption Tracking Application

## Overview

WattWatch is a full-stack web application designed to help users track and monitor their energy consumption (electricity and water usage). The application provides a dashboard for visualizing usage patterns, gamification features through badges and points, conservation tips, and data input capabilities. It's built with a modern tech stack featuring React on the frontend and Express.js on the backend, with PostgreSQL as the database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for fast development and optimized builds
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **API Design**: RESTful API with JSON responses
- **Development**: Hot reload with tsx for server-side development

### Data Storage Solutions
- **Primary Database**: PostgreSQL with the following schema:
  - Users table for authentication
  - Usage entries for tracking daily energy consumption
  - Tips table for conservation advice
  - Badges and user badges for gamification
  - Settings table for user preferences
- **ORM**: Drizzle ORM with Zod schema validation
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Dashboard System
- Real-time usage monitoring with visual charts
- Today's usage summary with electricity (kWh) and water (L) tracking
- Weekly usage trends and historical data visualization
- Alert system for usage exceeding predefined thresholds
- Points and savings calculation display

### Data Input System
- Manual usage entry with form validation
- Quick scenario buttons for common usage patterns
- Period-based tracking (daily, morning, afternoon, evening, night)
- Notes capability for additional context

### Gamification Features
- Badge system with achievement tracking
- Points accumulation based on conservation efforts
- Leaderboard functionality for competitive elements
- Progress tracking and milestone celebrations

### Tips and Education
- Categorized conservation tips (electricity vs water)
- Difficulty-based tip classification
- Random tip generation for discovery
- Potential savings estimates for each tip

### Responsive Design
- Mobile-first approach with adaptive navigation
- Desktop header navigation and mobile bottom navigation
- Touch-optimized interfaces for mobile devices
- Consistent design system across all screen sizes

## Data Flow

1. **User Input**: Users enter consumption data through forms or quick scenarios
2. **Validation**: Client-side validation with Zod schemas before submission
3. **API Processing**: Express.js routes handle data validation and database operations
4. **Database Storage**: Drizzle ORM manages type-safe database interactions
5. **Real-time Updates**: TanStack Query provides optimistic updates and cache management
6. **Visualization**: React components render charts and statistics from processed data
7. **Gamification**: Badge eligibility checks and points calculations happen server-side

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Router via Wouter)
- Express.js with TypeScript support
- Drizzle ORM with PostgreSQL adapter
- TanStack Query for data fetching and caching

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- shadcn/ui component library for pre-built components

### Development Tools
- Vite for build tooling and development server
- TypeScript for type safety across the stack
- ESBuild for server-side bundling in production
- Drizzle Kit for database migration management

### Database and Hosting
- Neon serverless PostgreSQL for cloud database hosting
- Environment-based configuration for database connections

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with hot module replacement
- tsx for server-side TypeScript execution with hot reload
- Concurrent development setup running both frontend and backend

### Production Build Process
1. Frontend: Vite builds optimized static assets to `dist/public`
2. Backend: ESBuild bundles server code to `dist/index.js`
3. Static files served by Express.js in production mode

### Platform Configuration
- Replit-optimized with specific port configurations (5000 internal, 80 external)
- Autoscale deployment target for production scaling
- PostgreSQL module integration for database provisioning

### Environment Variables
- `DATABASE_URL` for PostgreSQL connection
- `NODE_ENV` for environment-specific behavior
- Automatic database URL validation at startup

## Changelog
- June 17, 2025. Initial setup
- June 18, 2025. Restructured application to single-page layout with tabs
  - Removed multi-page navigation and classroom references
  - Combined all features (dashboard, data input, tips, badges) into one page
  - Eliminated leaderboard and competitive elements
  - Simplified for individual usage tracking
- June 19, 2025. Complete black and yellow rebrand implementation
  - Fixed React hooks order error that was breaking the application
  - Implemented professional black and yellow color scheme throughout
  - Added ESC key functionality to close settings modal
  - Updated all UI components, charts, and background colors
  - Replaced inconsistent white/gray elements with proper dark theme

## User Preferences

Preferred communication style: Simple, everyday language.
Application structure: Single page with tabbed interface, no classroom references or competitive elements.
Design preference: Professional black and yellow color scheme throughout the entire application.