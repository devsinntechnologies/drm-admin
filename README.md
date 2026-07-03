# DRM Admin Dashboard

A comprehensive admin management system built with modern web technologies for restaurant and business operations management.

---

## 📋 Table of Contents

- [Non-Technical Overview](#non-technical-overview)
- [Technical Documentation](#technical-documentation)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Development & Deployment](#development--deployment)

---

## Non-Technical Overview

### What is DRM Admin?

DRM Admin is a user-friendly web application designed to help business owners and managers manage their operations efficiently. Whether you're running a restaurant, managing multiple locations, or handling invoices and orders, this platform provides all the tools you need in one centralized place.

### Who Can Use It?

- **Business Owners**: Oversee all operations across single or multiple locations
- **Business Administrators**: Manage daily operations, staff, products, and customers
- **Super Administrators**: Handle system-wide management, reporting, and feature control

### Key Benefits

✅ **Simplified Management**: All business operations in one dashboard
✅ **Multi-User Support**: Different access levels for different roles
✅ **Real-Time Updates**: See changes instantly across the platform
✅ **Professional Reports**: Generate invoices and action logs easily
✅ **Secure Access**: Role-based permissions protect sensitive data
✅ **Scalable**: Manage single or multiple business locations

### Main Features

- **Dashboard**: Quick overview of key metrics and information
- **Business Management**: Create and manage multiple business locations
- **Inventory Management**: Track products, ingredients, and categories
- **Order Management**: Process and track customer orders
- **Invoice System**: Generate and manage billing documents
- **Staff Management**: Manage users and their roles
- **Table Management**: Organize seating for dine-in operations
- **Kitchen Operations**: Coordinate kitchen workflow
- **Activity Logs**: Track all system actions for compliance and auditing
- **Feature Control**: Enable/disable features based on subscription plan

---

## Technical Documentation

### Technology Stack

**Frontend Framework:**
- [Next.js 16.2.3](https://nextjs.org) - React framework with App Router
- [React 19.2.4](https://react.dev) - UI library
- [TypeScript 5](https://www.typescriptlang.org) - Type safety

**State Management:**
- [@reduxjs/toolkit 2.11.2](https://redux-toolkit.js.org) - State management
- [react-redux 9.2.0](https://react-redux.js.org) - React-Redux bindings

**UI Components & Styling:**
- [Tailwind CSS 4.2.2](https://tailwindcss.com) - Utility-first CSS framework
- [@radix-ui](https://radix-ui.com) - Headless UI components
  - Dialog, Alert Dialog components
- [Lucide React](https://lucide.dev) - Icon library
- [Iconsax React](https://iconsax.io) - Additional icon set

**Utilities:**
- [jsPDF 4.2.1](https://github.com/parallax/jsPDF) - PDF generation
- [jspdf-autotable 5.0.7](https://github.com/simonbengtsson/jsPDF-AutoTable) - PDF table formatting
- [Sonner 2.0.7](https://sonner.emilkowal.ski) - Toast notifications
- [Clsx 2.1.1](https://github.com/lukeed/clsx) - Conditional className utility
- [CVA](https://cva.style) - Class Variance Authority for component variants

**Package Manager:**
- [pnpm](https://pnpm.io) - Fast, disk space efficient package manager

**Code Quality:**
- [ESLint 9](https://eslint.org) - Code linting

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js App Router                     │
├─────────────────────────────────────────────────────────┤
│  Pages (Dashboard, Business Admin, Super Admin Views)   │
├─────────────────────────────────────────────────────────┤
│              React Components & Custom Hooks             │
├─────────────────────────────────────────────────────────┤
│    Redux Store (Authentication, Business Data, UI)      │
├─────────────────────────────────────────────────────────┤
│            Utilities & Helper Functions                 │
├─────────────────────────────────────────────────────────┤
│                 Backend API (External)                   │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
drm-admin/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Home page
│   │   ├── login/                   # Authentication pages
│   │   ├── dashboard/               # Dashboard pages
│   │   │   ├── businessAdmin/       # Business admin routes
│   │   │   │   ├── categories/
│   │   │   │   ├── ingredients/
│   │   │   │   ├── products/
│   │   │   │   ├── orders/
│   │   │   │   ├── invoices/
│   │   │   │   ├── kitchen/
│   │   │   │   ├── tables/
│   │   │   │   ├── users/
│   │   │   │   └── invoice-test/
│   │   │   └── superAdmin/          # Super admin routes
│   │   │       ├── businesses/
│   │   │       ├── features/
│   │   │       ├── subscriptions/
│   │   │       └── action-logs/
│   │   └── globals.css              # Global styles
│   │
│   ├── components/                  # Reusable React components
│   │   ├── admin/                  # Admin-specific components
│   │   │   └── AdminShell.tsx      # Admin layout wrapper
│   │   ├── common/                 # Shared components
│   │   │   └── DeleteConfirmDialog.tsx
│   │   ├── providers/              # Context/Redux providers
│   │   │   └── ReduxProvider.tsx
│   │   └── ui/                     # UI component library
│   │       ├── alert-dialog.tsx
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       └── table.tsx
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts              # Authentication logic
│   │   ├── useActiveBusinessId.ts  # Current business context
│   │   ├── useBusiness.ts          # Business data fetching
│   │   ├── useCategories.ts
│   │   ├── useIngredients.ts
│   │   ├── useInvoices.ts
│   │   ├── useOrders.ts
│   │   ├── usePlan.ts              # Subscription plan logic
│   │   ├── useProducts.ts
│   │   ├── useTables.ts
│   │   ├── useUsers.ts
│   │   └── useActionLogs.ts        # Activity logging
│   │
│   └── lib/                         # Utilities & configuration
│       ├── store.ts                # Redux store configuration
│       ├── utils.ts                # General utilities
│       ├── hooks.ts                # Library-level hooks
│       ├── constant.ts             # Application constants
│       └── features/               # Redux slices
│           └── auth/
│               └── authSlice.ts
│
├── public/                          # Static assets
│   └── business/                   # Business-related assets
│
├── next.config.ts                   # Next.js configuration
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.mjs               # PostCSS configuration
├── eslint.config.mjs                # ESLint configuration
├── package.json                     # Dependencies & scripts
├── pnpm-lock.yaml                   # Dependency lock file
└── README.md                        # This file
```

### Key Components & Modules

**Custom Hooks** (`src/hooks/`)
- Encapsulate business logic for data fetching and state management
- Provide clean interfaces for components to interact with data
- Handle loading, error, and success states

**Redux Store** (`src/lib/store.ts`)
- Centralized state management
- Persistent authentication state
- Business context and user preferences

**UI Components** (`src/components/ui/`)
- Reusable, styled components built with Radix UI
- Consistent look and feel across the application
- Accessibility built-in

---

## Getting Started

### Prerequisites

- Node.js 18+ or later
- pnpm package manager (recommended)
- Git for version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd drm-admin
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory with required API endpoints and keys:
   ```
   NEXT_PUBLIC_API_URL=<your-api-url>
   # Add other environment variables as needed
   ```

### Running the Application

**Development Mode:**
```bash
pnpm dev
```
The application will be available at [http://localhost:3000](http://localhost:3000)

**Production Build:**
```bash
pnpm build
pnpm start
```

**Linting:**
```bash
pnpm lint
```

---

## Development & Deployment

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test locally with `pnpm dev`

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add feature description"
   git push origin feature/your-feature-name
   ```

4. **Submit a pull request** for code review

### Deployment Options

**Vercel (Recommended):**
The easiest way to deploy is using [Vercel](https://vercel.com), created by the Next.js team:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project to Vercel
3. Configure environment variables
4. Deploy with a single click

Refer to [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more options.

### Performance Considerations

- **Code Splitting**: Next.js automatically splits code at the page level
- **Image Optimization**: Use Next.js Image component for responsive images
- **CSS-in-JS**: Tailwind CSS is purged during build for minimal CSS
- **Font Optimization**: Geist font is optimized for performance

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)

---

## Support & Contributing

For issues, bugs, or feature requests, please open an issue in the repository.

For contributing guidelines, refer to CONTRIBUTING.md (if available).

---

**Last Updated:** 2026-07-03
