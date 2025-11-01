# Byte Gear - GEARVN E-Commerce Platform

Modern full-stack e-commerce platform for high-end PCs, laptops, and gaming gear.

## 📋 Overview

Byte Gear is a comprehensive e-commerce solution featuring a Next.js frontend and NestJS backend, designed for selling computers, laptops, and gaming equipment in Vietnam.

## 🏗️ Architecture

### Frontend (Client)

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod
- **Real-time**: Socket.io Client
- **Editor**: TipTap (Rich text editor)
- **Build Tool**: Turbopack

### Backend (Server)

- **Framework**: NestJS 11
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js (JWT, Google OAuth, Local)
- **Real-time**: Socket.io
- **File Upload**: Cloudinary
- **Email**: Resend with Handlebars templates
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator + class-transformer

## ✨ Features

### Core E-Commerce

- Product catalog with categories
- Shopping cart functionality
- Order management system
- Payment integration (VNPay, COD)
- Product reviews and ratings
- Inventory management

### User Management

- User authentication (JWT, Google OAuth)
- Role-based access control (Admin, User)
- User profiles and settings
- Account verification via email

### Additional Features

- Real-time chat support
- Blog system with rich text editor
- Events and promotions
- Dashboard analytics
- Search and filtering
- Address management with Vietnam provinces/cities
- Excel export functionality

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MongoDB database
- Cloudinary account (for image storage)
- Resend API key (for email)
- VNPay credentials (for payments)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/byte-gear.git
cd byte-gear
```

2. Install all dependencies:

```bash
npm run install:all
```

### Configuration

> **🔒 SECURITY NOTE**: The JWT_SECRET/JWT_SECRET_KEY environment variable is **critical for security**.
> - It must be the **same value** in both client and server `.env` files
> - Generate a strong secret: `openssl rand -hex 64`
> - Never commit `.env` files to version control (already in `.gitignore`)
> - The client middleware uses this to verify JWT signatures server-side

#### Server (NestJS)

Create `.env` file in `server/` directory:

```env
# Server
PORT=8000

# Database
MONGO_URI=mongodb://localhost:27017/byte-gear

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Resend
RESEND_API_KEY=your-resend-api-key

# VNPay
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/success
```

#### Client (Next.js)

Create `.env.local` file in `client/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000

# CRITICAL: Must match server JWT_SECRET_KEY
JWT_SECRET=your-jwt-secret-here-must-match-server
```

**Note**: Use `.env.example` files in both directories as templates.

### Running the Application

#### Development Mode

Using npm scripts:

```bash
npm run dev
```

Or using the bash script:

```bash
./dev.sh dev
```

This will start:

- Client: `http://localhost:3000`
- Server: `http://localhost:8000`
- API Docs: `http://localhost:8000/api-docs`

#### Production Mode

1. Build both applications:

```bash
npm run build
```

2. Start the applications:

```bash
npm run start
```

### Individual Commands

**Client:**

```bash
cd client
npm run dev      # Development
npm run build    # Build for production
npm run start    # Start production server
```

**Server:**

```bash
cd server
npm run start:dev    # Development
npm run build        # Build
npm run start:prod   # Production
```

## 📁 Project Structure

```
byte-gear/
├── client/              # Next.js frontend
│   ├── src/
│   │   ├── app/         # App router pages
│   │   │   ├── (client)/ # Public pages
│   │   │   └── admin/   # Admin dashboard
│   │   ├── components/   # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── stores/      # Zustand stores
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
│
├── server/              # NestJS backend
│   ├── src/
│   │   ├── auth/        # Authentication
│   │   ├── user/        # User management
│   │   ├── product/     # Products
│   │   ├── category/    # Categories
│   │   ├── order/       # Orders
│   │   ├── payment/     # Payments
│   │   ├── blog/        # Blog
│   │   ├── chat/        # Chat system
│   │   ├── event/       # Events
│   │   └── dashboard/   # Dashboard
│   └── dist/            # Compiled output
│
└── package.json         # Root package.json
```

## 🛠️ Available Scripts

### Root Level

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both applications
- `npm run start` - Start both applications in production mode
- `npm run install:all` - Install all dependencies (root, client, server)
- `npm run lint` - Lint both projects
- `npm run clean` - Remove all node_modules

### Client

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Server

- `npm run start:dev` - Start in development mode (watch mode)
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the project
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests

## 🔒 Environment Variables

Required environment variables are listed in the configuration section above. Make sure to set up all credentials before running the application.

## 📚 API Documentation

Once the server is running, API documentation is available at:

```
http://localhost:8000/api-docs
```

The API is versioned and uses `/api/v1/` prefix for all endpoints.

## 🧪 Testing

### Server Tests

```bash
cd server
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

## 🛡️ Authentication

The application supports multiple authentication methods:

- **JWT**: Local email/password authentication
- **Google OAuth**: Sign in with Google account
- **Role-based**: Admin and User roles

## 💳 Payment Methods

- **VNPay**: Online payment gateway
- **COD**: Cash on delivery

## 📝 License

Private/Unlicensed

## 👥 Authors

Development Team

## 🙏 Acknowledgments

Built with modern technologies and best practices for scalable e-commerce applications.
