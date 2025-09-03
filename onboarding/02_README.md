# 🚀 Welcome to Polka - Engineer Onboarding Guide

Welcome to the Polka project! This guide will walk you through everything you need to know to get started as a new engineer on the team.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Environment Setup](#environment-setup)
4. [Getting Started](#getting-started)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Building & Deployment](#building--deployment)
8. [Troubleshooting](#troubleshooting)
9. [Useful Commands](#useful-commands)
10. [Next Steps](#next-steps)

## 🎯 Prerequisites

Before you begin, make sure you have the following installed on your system:

### Required Software
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Rust** (latest stable version) - [Install here](https://rustup.rs/)
- **Git** - [Download here](https://git-scm.com/)

### IDE Setup (Recommended)
- **VS Code** with the following extensions:
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [TypeScript and JavaScript Language Features](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next)
  - [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 🏗️ Project Overview

**Polka** is a desktop application built with:
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Rust with Tauri 2
- **UI Framework**: Tailwind CSS + Radix UI components
- **State Management**: Zustand
- **Database**: SQLite (via rusqlite)

The application appears to be a session management system with authentication capabilities.

## ⚙️ Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd polka
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Rust dependencies (this will happen automatically when building)
```

### 3. Verify Installation
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Rust version
rustc --version

# Check Cargo version
cargo --version
```

## 🚀 Getting Started

### First Time Setup
1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev` (for web-only development)
3. **Start Tauri development**: `npm run tauri dev` (for full desktop app)

### Development Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Starts Vite dev server (web-only) | Frontend development, testing UI components |
| `npm run tauri dev` | Starts Tauri development mode | Full desktop app development, testing native features |
| `npm run build` | Builds the web application | Production build, testing build process |
| `npm run tauri build` | Builds the desktop application | Creating distributable desktop app |
| `npm run preview` | Preview production build | Testing production build locally |

## 🔄 Development Workflow

### 1. **Web Development Mode** (Recommended for UI work)
```bash
npm run dev
```
- Opens browser at `http://localhost:1420`
- Hot reload for React components
- Faster iteration for UI changes
- No native features (database, file system, etc.)

### 2. **Desktop Development Mode** (Recommended for full-stack work)
```bash
npm run tauri dev
```
- Opens the actual desktop application
- Full access to native features
- Slower build times but complete functionality
- Database operations work
- File system access available

### 3. **Hybrid Approach**
- Use `npm run dev` for UI component development
- Switch to `npm run tauri dev` when testing native features
- Use `npm run build` to test production builds

## 🧪 Testing

### Frontend Testing
```bash
# Start web dev server for UI testing
npm run dev

# Open browser and test components
# Navigate to http://localhost:1420
```

### Full Application Testing
```bash
# Start Tauri dev mode for full testing
npm run tauri dev

# Test all features including:
# - Authentication
# - Session management
# - Database operations
# - Native file operations
```

### Build Testing
```bash
# Test production web build
npm run build
npm run preview

# Test production desktop build
npm run tauri build
```

## 🏗️ Building & Deployment

### Web Build
```bash
npm run build
```
- Outputs to `dist/` directory
- Ready for web deployment

### Desktop Build
```bash
npm run tauri build
```
- Creates platform-specific installers
- Outputs to `src-tauri/target/release/`
- Supports Windows (.msi), macOS (.dmg), Linux (.AppImage)

## 🐛 Troubleshooting

### Common Issues

#### 1. **Rust Dependencies Not Found**
```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
npm run tauri dev
```

#### 2. **Node Modules Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. **Tauri Build Failures**
```bash
# Check Rust toolchain
rustup show

# Ensure you have the right target
rustup target list --installed

# Clean Tauri build
npm run tauri clean
```

#### 4. **Port Already in Use**
```bash
# Kill process using port 1420
lsof -ti:1420 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Getting Help
- Check the [Tauri documentation](https://tauri.app/docs)
- Review [React documentation](https://react.dev/)
- Check [Rust documentation](https://doc.rust-lang.org/)
- Ask team members or create an issue

## 📚 Useful Commands

### Development
```bash
# Start web development
npm run dev

# Start desktop development
npm run tauri dev

# Build web version
npm run build

# Build desktop version
npm run tauri build

# Preview web build
npm run preview
```

### Rust/Tauri Specific
```bash
# Clean Rust build artifacts
cargo clean

# Update Rust dependencies
cargo update

# Check Rust code
cargo check

# Run Rust tests
cargo test

# Tauri specific commands
npm run tauri clean
npm run tauri info
```

### Git Workflow
```bash
# Check status
git status

# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push changes
git push origin feature/your-feature-name
```

## 🎯 Next Steps

### 1. **Explore the Codebase**
- Start with `src/App.tsx` to understand the main application
- Review `src/components/` for UI components
- Check `src-tauri/src/` for Rust backend code
- Examine `src/store/` for state management

### 2. **Run the Application**
- Use `npm run dev` for web development
- Use `npm run tauri dev` for desktop development

### 3. **Make Your First Change**
- Modify a component in `src/components/`
- See changes in real-time with hot reload
- Test your changes thoroughly

### 4. **Learn the Stack**
- **React 19**: Modern React with hooks and functional components
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Tauri 2**: Modern desktop app framework
- **Rust**: Systems programming language for backend

### 5. **Join the Team**
- Attend team meetings
- Ask questions in team channels
- Review and contribute to documentation
- Participate in code reviews

## 🆘 Need Help?

- **Team Lead**: [Contact Information]
- **Slack Channel**: #polka-dev
- **Documentation**: [Internal Wiki Link]
- **Issue Tracker**: [GitHub Issues/Jira Link]

---

**Welcome to the team! 🎉**

Remember: There's no such thing as a stupid question. We're all here to help each other succeed!
