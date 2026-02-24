# SimpleDFe - Document Management System

## Overview
SimpleDFe is a full-stack web application for managing and processing Brazilian fiscal documents (NFe and NFSe). It offers document visualization, DANFE generation, comprehensive reporting, and user management. The system aims to provide a complete solution for businesses handling electronic fiscal documents.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API
- **Authentication**: JWT-based authentication
- **File Processing**: Multer for XML file uploads

### Database Architecture
- **Primary Database**: PostgreSQL with Drizzle ORM (via Neon serverless)
- **Secondary Database**: MySQL for legacy data integration
- **Schema Management**: Drizzle Kit

### Key Features
- **Authentication**: JWT, user registration with email verification, bcrypt password hashing, role-based access control.
- **Document Processing**: Multi-format XML parsing (NFe, NFSe), multiple DANFE/DACTE PDF generation strategies (PHP-based, Node.js, HTML-to-PDF), XML schema validation.
- **File Management**: Secure upload handling, temporary file management, PDF generation and storage.
- **Reporting System**: Dynamic PDF report generation, company-based filtering, tax calculation, date-range analytics.
- **Email Services**: Multiple provider support (SendGrid, MailerSend, Resend), welcome emails, template-based system.
- **ERP Integration**: SOAP-based integration with ERP systems for supplier pre-registration, including robust logging for debugging.
- **Version Notifications**: System to inform users about updates and changelogs.
- **Data Handling**: Standardized date filtering across APIs, batch export of XML and DANFE/DANFSE, case-insensitive email login.
- **CTe Implementation**: Full support for CTe (Conhecimento de Transporte Eletrônico) documents, including viewing, events, and bulk download of XML and DACTE.

## External Dependencies
- **PHP Bridge**: `sped-da` library (for Brazilian fiscal document processing), Composer, PHP Runtime.
- **Email Service Providers**: SendGrid, MailerSend, Resend.
- **Databases**: Neon PostgreSQL, MySQL.
- **APIs**: ReceitaWS (for CNPJ lookup), TOTVS ERP (SOAP API).
- **Development Tools**: Vite, Replit.