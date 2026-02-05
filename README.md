# Online FIR Portal

A secure, production-ready web portal for filing and tracking First Information Reports (FIRs) with comprehensive security features, role-based access control, and end-to-end encryption.

## 🚀 Overview

The Online FIR Portal is a full-stack application that modernizes the FIR filing process while implementing enterprise-grade security measures. Built with a monorepo architecture separating frontend and backend concerns, it serves as both a practical solution and a comprehensive security implementation showcase.

### Key Features

- 🔐 **Multi-Factor Authentication** with email OTP and TOTP support
- 🛡️ **End-to-End Encryption** using AES-256-GCM for all sensitive data
- 👥 **Role-Based Access Control** with citizen, police, and admin roles
- 📝 **Digital Signatures** for data integrity and non-repudiation
- 📊 **Real-time Dashboard** for FIR tracking and management
- 📱 **Responsive Design** with mobile-first approach
- 🔍 **Comprehensive Audit Logging** for security monitoring

## 🏗️ Architecture

```
online-fir-portal/
├── OnlineFirPortal.frontend/    # Next.js 16 frontend application
├── OnlineFirPortal.backend/     # Express.js backend API
├── SECURITY_WORKFLOW_EXPLAINED.md  # Complete security documentation
└── SECURITY_EVALUATION.txt      # Security evaluation results
```

### Frontend (OnlineFirPortal.frontend/)
- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS, shadcn/ui components
- **State Management**: React hooks with context API
- **Forms**: React Hook Form with Zod validation
- **Authentication**: JWT tokens with httpOnly cookies

### Backend (OnlineFirPortal.backend/)
- **Framework**: Express.js with TypeScript
- **Database**: SQLite with better-sqlite3
- **Authentication**: bcryptjs, jsonwebtoken
- **Email**: Resend API for OTP notifications
- **Security**: Web Crypto API, custom encryption

## 🛡️ Security Implementation

This project implements comprehensive security features for production use:

### Authentication & Authorization
- **Password Security**: bcrypt with 10 salt rounds
- **Multi-Factor Auth**: Email OTP (primary) + TOTP (backup)
- **JWT Tokens**: Access (15min) + Refresh (7days) tokens
- **Role-Based Access**: 3-tier permission system (citizen/police/admin)
- **Session Management**: Secure httpOnly cookies

### Data Protection
- **Encryption at Rest**: AES-256-GCM for FIR data and documents
- **Encryption in Transit**: HTTPS with secure headers
- **Key Management**: scrypt key derivation with unique salts
- **Digital Signatures**: RSA-PSS with SHA-256 hashing
- **Integrity Verification**: Authentication tags prevent tampering

### Access Control
- **Ownership Verification**: Citizens can only access own resources
- **Station Assignment**: Police limited to jurisdiction
- **Business Rules**: Contextual permissions and constraints
- **Audit Logging**: Complete access trail with timestamps

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun runtime
- Git for version control
- Email service (Resend API key)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd online-fir-portal
```

### 2. Backend Setup
```bash
cd OnlineFirPortal.backend

# Install dependencies
npm install
# or: bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run build
npm start
```

**Required Environment Variables:**
```env
# Database
DATABASE_PATH=./data/fir-portal.db

# Authentication
JWT_SECRET=your-256-bit-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
FIR_ENCRYPTION_KEY=your-32-char-encryption-key

# Email Service
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com

# Application
NODE_ENV=development
PORT=3001
```

### 3. Frontend Setup
```bash
cd ../OnlineFirPortal.frontend

# Install dependencies
npm install
# or: bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

**Required Environment Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Online FIR Portal
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📖 Documentation

### Security Documentation
- **[SECURITY_WORKFLOW_EXPLAINED.md](./SECURITY_WORKFLOW_EXPLAINED.md)** - Complete security implementation guide with line numbers and detailed explanations
- **[SECURITY_EVALUATION.txt](./SECURITY_EVALUATION.txt)** - Security evaluation results and compliance report

### API Documentation
- **Backend API**: Available at `/api/docs` when running backend
- **Authentication Flow**: See security documentation for complete flow

### Development Documentation
- **Frontend README**: [OnlineFirPortal.frontend/README.md](./OnlineFirPortal.frontend/README.md)
- **Backend Structure**: See OnlineFirPortal.backend/src/ directory

## 🧪 Testing

### Backend Tests
```bash
cd OnlineFirPortal.backend
npm test
# or: bun test
```

### Security Testing
The project includes comprehensive security testing:
- Authentication flow testing
- Encryption/decryption verification
- Access control validation
- API endpoint security testing

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-mfa` - MFA verification
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### FIR Management
- `GET /api/firs` - List FIRs (role-based)
- `POST /api/firs` - Create new FIR
- `GET /api/firs/:id` - Get specific FIR
- `PUT /api/firs/:id` - Update FIR
- `POST /api/firs/:id/documents` - Upload documents

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/keys` - Manage cryptographic keys

## 🔧 Configuration

### Database Setup
The application uses SQLite with automatic schema creation:
- Database file: `./data/fir-portal.db`
- Automatic migrations on startup
- Sample data creation for development

### Email Configuration
Uses Resend for email notifications:
- OTP delivery for MFA
- Account verification emails
- Status notifications

### Security Configuration
- JWT secrets must be cryptographically secure
- Encryption keys should be unique per deployment
- HTTPS required in production

## 🚀 Deployment

### Production Deployment
1. **Environment Setup**: Configure all required environment variables
2. **Database**: Ensure SQLite file permissions are correct
3. **HTTPS**: Configure SSL certificates
4. **Email**: Set up production email service
5. **Monitoring**: Configure logging and monitoring

### Docker Deployment
```bash
# Build images
docker build -t fir-portal-frontend ./OnlineFirPortal.frontend
docker build -t fir-portal-backend ./OnlineFirPortal.backend

# Run with docker-compose
docker-compose up -d
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Express.js 5** - Web framework
- **TypeScript 5** - Type safety
- **SQLite** - Database with better-sqlite3
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT tokens
- **Resend** - Email service
- **Web Crypto API** - Cryptographic operations

### Security
- **AES-256-GCM** - Symmetric encryption
- **RSA-PSS** - Digital signatures
- **scrypt** - Key derivation
- **SHA-256** - Cryptographic hashing
- **JWT** - Token-based authentication

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions and support:
- Create an issue in the repository
- Check the security documentation for implementation details
- Review the API documentation for integration guidance

## 🔒 Security Notice

This application implements security features for educational and production purposes. While comprehensive security measures are implemented, always conduct your own security assessment before production deployment.

**Security Features Implemented:**
- ✅ Multi-factor authentication
- ✅ End-to-end encryption
- ✅ Role-based access control
- ✅ Digital signatures
- ✅ Audit logging
- ✅ Secure session management
- ✅ Input validation and sanitization

**For production deployment:**
- Use environment-specific secrets
- Enable HTTPS everywhere
- Configure proper logging and monitoring
- Regular security updates and patches
- Security audit and penetration testing