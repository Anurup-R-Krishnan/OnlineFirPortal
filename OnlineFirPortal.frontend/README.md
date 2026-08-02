# Online FIR Portal - Frontend

A modern, secure React application for filing and tracking First Information Reports (FIRs). This is the frontend component of the Online FIR Portal system, built with Next.js 16 and featuring comprehensive security integration.

## 🚀 Features

### 🔐 Authentication & Security
- **Multi-Factor Authentication (MFA)**: Email OTP and TOTP (Authenticator app)
- **Secure Session Management**: JWT tokens with httpOnly secure cookies
- **Role-Based UI**: Dynamic interface based on user role (citizen/police/admin)
- **Client-Side Validation**: Comprehensive input validation with Zod schemas
- **Security Headers**: CSRF protection, XSS prevention, secure cookies

### 📝 FIR Management
- **Interactive FIR Forms**: Step-by-step guided FIR filing process
- **Document Upload**: Drag-and-drop file upload with progress indicators
- **Real-time Status Tracking**: Live FIR status updates with timeline
- **Search & Filter**: Advanced search and filtering capabilities
- **QR Code Generation**: Share FIR tracking information securely

### 📊 Dashboard & Analytics
- **Role-Based Dashboards**: Customized views for different user types
- **Visual Analytics**: Charts and graphs for FIR trends
- **Quick Actions**: One-click access to common tasks
- **Notification System**: Real-time alerts and updates

### 🎨 User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Theme toggle for user preference
- **Accessibility**: WCAG 2.1 compliant design
- **Offline Support**: Limited offline functionality for critical features

## 🛠️ Technical Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19 with shadcn/ui components
- **Styling**: Tailwind CSS 4 with custom design system
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context API with useReducer
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Type Safety**: TypeScript 5 with strict mode

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun runtime
- Backend API server running (see main README)

### 1. Install Dependencies

```bash
npm install
# or: bun install
# or: pnpm install
```

### 2. Environment Configuration

Copy `.env` to `.env.local` and configure:

```bash
cp .env .env.local
```

**Required variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_APP_NAME=Online FIR Portal
NEXT_PUBLIC_VERSION=1.0.0
```

**Optional variables:**
```env
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=false
NEXT_PUBLIC_SUPPORT_EMAIL=support@example.com
```

### 3. Start Development Server

```bash
npm run dev
# or: bun dev
```

The application will be available at `http://localhost:4000`

### 4. Authentication Setup

The frontend connects to the backend API for authentication. Default test users (created by backend):

- **Citizen**: `john.doe@example.com` / `password123` (MFA enabled)
- **Police**: `officer.smith@police.gov` / `police123`
- **Admin**: `admin@fir.gov` / `admin123`

## 📁 Project Structure

```
OnlineFirPortal.frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes group
│   │   ├── login/               # Login page
│   │   ├── register/            # Registration page
│   │   └── verify-mfa/         # MFA verification page
│   ├── (dashboard)/             # Protected routes group
│   │   ├── dashboard/          # Main dashboard
│   │   ├── file-fir/          # FIR creation page
│   │   ├── track/              # FIR tracking page
│   │   ├── profile/            # User profile
│   │   └── settings/          # Application settings
│   ├── admin/                  # Admin-specific routes
│   │   ├── users/              # User management
│   │   ├── system/             # System settings
│   │   └── reports/           # System reports
│   ├── api/                    # API routes (if any)
│   │   └── auth/              # Next.js API routes
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx               # Home page
├── components/                 # React components
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx         # Button component
│   │   ├── form.tsx           # Form components
│   │   ├── input.tsx          # Input components
│   │   └── ...
│   ├── forms/                 # Form components
│   │   ├── fir-form.tsx       # FIR creation form
│   │   ├── auth-forms.tsx     # Authentication forms
│   │   └── profile-form.tsx   # Profile management
│   ├── charts/                # Chart components
│   │   ├── fir-trends.tsx     # FIR trends chart
│   │   └── status-breakdown.tsx # Status breakdown
│   └── layout/               # Layout components
│       ├── header.tsx          # Application header
│       ├── sidebar.tsx         # Navigation sidebar
│       └── footer.tsx         # Application footer
├── lib/                      # Utility libraries
│   ├── api.ts                 # API client
│   ├── auth.ts                # Authentication utilities
│   ├── utils.ts               # General utilities
│   ├── validations.ts         # Zod schemas
│   └── constants.ts           # Application constants
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts            # Authentication hook
│   ├── useFIR.ts            # FIR management hook
│   └── useLocalStorage.ts    # Local storage hook
├── types/                    # TypeScript type definitions
│   ├── auth.ts               # Authentication types
│   ├── fir.ts                # FIR-related types
│   └── api.ts                # API response types
├── public/                   # Static assets
│   ├── icons/                # Application icons
│   └── images/               # Static images
├── .env              # Environment template
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

### 2. Set up environment variables

Copy `.env` to `.env` and configure:

```bash
cp .env .env
```

**Required variables:**

- `RESEND_API_KEY`: Get your API key from [resend.com/api-keys](https://resend.com/api-keys) (free tier available)
- `JWT_SECRET`: A strong random string for JWT token signing
- `FROM_EMAIL`: The email address to send OTPs from (must be verified in Resend)

### 3. Initialize the database

```bash
bun run scripts/init-db.ts
```

This creates the SQLite database with sample users:
- **Citizen**: `john.doe@example.com` / `password123` (MFA enabled)
- **Police**: `officer.smith@police.gov` / `police123`
- **Admin**: `admin@fir.gov` / `admin123`

### 4. Start the development server

```bash
bun dev
# or pnpm dev / npm run dev
```

The app will be available at `http://localhost:4000`

### 5. Test login with MFA

When MFA is enabled, you'll receive an OTP via email. In development mode, the OTP is also logged to the console.

## Project Structure

```
online-fir-portal/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── firs/         # FIR management endpoints
│   ├── dashboard/        # User dashboard
│   ├── file-fir/        # File FIR page
│   └── track/           # Track FIR page
├── components/           # React components
│   └── ui/              # UI primitives
├── lib/                 # Core libraries
│   ├── auth-middleware.ts    # Authentication & authorization
│   ├── access-control.ts     # RBAC system
│   ├── jwt.ts               # JWT token management
│   ├── security.ts          # Encryption & hashing
│   ├── email-service.ts     # Email notifications
│   └── db.ts               # Database operations
├── data/                # SQLite database & uploads
└── scripts/            # Database initialization
```

## 🔄 Development Workflow

### Code Style & Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Type Checking

```bash
# Run TypeScript compiler
npm run type-check

# Or use tsc directly
npx tsc --noEmit
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Environment Variables

The frontend uses these environment variables for configuration:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_APP_NAME=Online FIR Portal

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_OFFLINE=false

# Application Settings
NEXT_PUBLIC_VERSION=1.0.0
NEXT_PUBLIC_SUPPORT_EMAIL=support@example.com
NEXT_PUBLIC_MAX_FILE_SIZE=10485760

# Security Settings
NEXT_PUBLIC_SESSION_TIMEOUT=900000
NEXT_PUBLIC_MFA_TIMEOUT=600000
```

### Custom Configuration

#### Tailwind CSS Customization

The project uses Tailwind CSS with custom design tokens:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        // Custom color palette
      },
    },
  },
}
```

#### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['example.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}
```

## 🧪 Testing

### Unit Testing

```bash
# Run tests with Jest
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### End-to-End Testing

```bash
# Run E2E tests with Playwright
npm run test:e2e

# Run specific test file
npm run test:e2e fir-creation.spec.ts
```

## 🎨 UI Components

The project uses shadcn/ui components with customizations:

### Available Components

- **Forms**: Input, Select, Checkbox, Radio, Textarea
- **Feedback**: Toast, Alert, Dialog, Modal
- **Navigation**: Menu, Sidebar, Breadcrumb, Tabs
- **Data Display**: Table, Card, Badge, Progress
- **Charts**: Line, Bar, Pie charts with Recharts

### Custom Components

- **FIRForm**: Multi-step FIR creation form
- **StatusTracker**: Visual FIR status tracking
- **DocumentUploader**: Drag-and-drop file upload
- **UserDashboard**: Role-based dashboard layout

## 📱 Responsive Design

The application is designed to work across all devices:

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1440px

### Mobile Features

- Touch-friendly interface
- Swipe gestures for navigation
- Mobile-optimized forms
- Progressive Web App (PWA) support

## 🔐 Security Features (Frontend)

### Client-Side Security

- **Input Sanitization**: All user inputs sanitized
- **XSS Prevention**: Content Security Policy headers
- **CSRF Protection**: SameSite cookies and CSRF tokens
- **Secure Cookies**: httpOnly, secure, sameSite settings

### Authentication Flow

1. **Login**: Username/password → JWT token
2. **MFA**: Email/OTP verification → Session activation
3. **Session**: Secure cookie with refresh token rotation
4. **Logout**: Secure token invalidation

### API Security

- **Request Interceptors**: Automatic token attachment
- **Response Interceptors**: Error handling and token refresh
- **Rate Limiting**: Client-side request throttling
- **Retry Logic**: Exponential backoff for failed requests

## 📊 Performance Optimization

### Code Splitting

- **Route-based**: Automatic with Next.js App Router
- **Component-based**: Dynamic imports for heavy components
- **Vendor Splitting**: Separate bundles for third-party libraries

### Optimization Techniques

- **Image Optimization**: Next.js Image component
- **Font Optimization**: Subset loading for custom fonts
- **Bundle Analysis**: Regular bundle size monitoring
- **Caching**: Strategic caching for API responses

### Performance Metrics

- **Lighthouse Score**: > 90 for all categories
- **Core Web Vitals**: Optimized for LCP, FID, CLS
- **Bundle Size**: < 500KB for initial load
- **Time to Interactive**: < 3 seconds

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 4000
CMD ["npm", "start"]
```

### Self-Hosted

```bash
# Build for production
npm run build

# Use PM2 for process management
pm2 start ecosystem.config.js

# Or use any process manager of choice
npm start
```

## 📚 Documentation

### Component Documentation

- **Storybook**: `npm run storybook`
- **Component Props**: TypeScript interfaces
- **Usage Examples**: In-component JSDoc

### API Documentation

- **Backend API**: See main repository README
- **Frontend API Client**: `lib/api.ts`
- **Type Definitions**: `types/api.ts`

## 🤝 Contributing Guidelines

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Install dependencies
4. Make your changes
5. Add tests if applicable
6. Ensure all tests pass
7. Submit a pull request

### Code Standards

- Use TypeScript for all new code
- Follow ESLint configuration
- Write meaningful commit messages
- Update documentation as needed
- Test across different devices

## 📞 Support & Help

### Troubleshooting

**Common Issues:**

1. **API Connection**: Ensure backend is running on correct port
2. **Authentication**: Clear browser cookies and try again
3. **Build Errors**: Clear `node_modules` and reinstall
4. **Type Errors**: Ensure TypeScript configuration is correct

### Getting Help

- **Issues**: Report bugs via GitHub issues
- **Documentation**: Check component props and API docs
- **Community**: Join our Discord server
- **Email**: Contact support team

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](../../LICENSE) file for details.

---

**Note**: This is the frontend component of the Online FIR Portal. Please see the main [README](../../README.md) for complete project information and setup instructions.
