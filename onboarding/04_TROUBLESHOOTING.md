# 🐛 Troubleshooting Guide

This guide covers common issues and their solutions when working with the Polka project.

## 🚨 Critical Issues

### Build Won't Start

#### **Error: "command not found: tauri"**
```bash
# Solution: Install Tauri CLI globally
npm install -g @tauri-apps/cli

# Or use npx
npx @tauri-apps/cli dev
```

#### **Error: "Rust toolchain not found"**
```bash
# Solution: Install/update Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup update
```

#### **Error: "Port 1420 already in use"**
```bash
# Solution 1: Kill the process
lsof -ti:1420 | xargs kill -9

# Solution 2: Use different port
npm run dev -- --port 3000
```

## 🔧 Development Issues

### **Hot Reload Not Working**
```bash
# Solution: Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### **TypeScript Errors**
```bash
# Solution: Check TypeScript version
npx tsc --version

# Reinstall types if needed
npm install @types/react @types/react-dom
```

### **Tailwind CSS Not Working**
```bash
# Solution: Rebuild CSS
npm run build
npm run dev
```

## 🦀 Rust/Tauri Issues

### **Cargo Build Failures**
```bash
# Solution 1: Clean and rebuild
cargo clean
npm run tauri dev

# Solution 2: Update Rust toolchain
rustup update
rustup default stable

# Solution 3: Check Rust version compatibility
rustc --version
# Should be 1.70+ for Tauri 2
```

### **Tauri Plugin Errors**
```bash
# Solution: Check plugin compatibility
npm list @tauri-apps/plugin-opener

# Reinstall if needed
npm install @tauri-apps/plugin-opener@latest
```

### **Database Connection Issues**
```bash
# Solution: Check SQLite installation
# On macOS: brew install sqlite3
# On Ubuntu: sudo apt-get install sqlite3

# Verify database file permissions
ls -la src-tauri/
```

## 📦 Package Management Issues

### **npm Install Fails**
```bash
# Solution 1: Clear cache
npm cache clean --force

# Solution 2: Delete and reinstall
rm -rf node_modules package-lock.json
npm install

# Solution 3: Use different package manager
yarn install
# or
pnpm install
```

### **Version Conflicts**
```bash
# Solution: Check for version mismatches
npm ls

# Update specific packages
npm update @tauri-apps/api @tauri-apps/cli
```

### **Peer Dependency Warnings**
```bash
# Solution: Install peer dependencies
npm install --legacy-peer-deps

# Or use npm 7+ with automatic peer resolution
npm install
```

## 🌐 Network & Port Issues

### **Port Already in Use**
```bash
# Find what's using the port
lsof -i :1420

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### **Firewall Issues**
```bash
# macOS: Check System Preferences > Security & Privacy > Firewall
# Windows: Check Windows Defender Firewall
# Linux: Check ufw or iptables
```

## 💾 Database Issues

### **SQLite Database Locked**
```bash
# Solution: Check if multiple instances are running
ps aux | grep polka

# Kill all instances and restart
pkill -f polka
npm run tauri dev
```

### **Database File Corrupted**
```bash
# Solution: Delete and recreate database
rm -f src-tauri/data.db
npm run tauri dev
```

## 🖥️ Platform-Specific Issues

### **macOS Issues**

#### **Permission Denied Errors**
```bash
# Solution: Grant full disk access to Terminal/VS Code
# System Preferences > Security & Privacy > Privacy > Full Disk Access
```

#### **Code Signing Issues**
```bash
# Solution: Disable code signing for development
# Add to tauri.conf.json:
# "macOS": { "codeSigning": false }
```

### **Windows Issues**

#### **Build Tools Missing**
```bash
# Solution: Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
```

#### **Path Too Long Errors**
```bash
# Solution: Enable long path support
# Run as Administrator: fsutil behavior set SymlinkEvaluation L2L:1 R2R:1 L2R:1 R2L:1
```

### **Linux Issues**

#### **Missing Dependencies**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential libssl-dev pkg-config

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install openssl-devel
```

#### **Audio Backend Issues**
```bash
# Solution: Install ALSA development libraries
sudo apt-get install libasound2-dev
# or
sudo yum install alsa-lib-devel
```

## 🔍 Debugging Tips

### **Enable Verbose Logging**
```bash
# Tauri verbose logging
RUST_LOG=debug npm run tauri dev

# Vite verbose logging
npm run dev -- --debug
```

### **Check System Resources**
```bash
# Monitor CPU/Memory usage
top
htop

# Check disk space
df -h

# Check available memory
free -h
```

### **Verify Dependencies**
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

## 📞 Getting Help

### **Before Asking for Help**
1. ✅ Check this troubleshooting guide
2. ✅ Search existing issues
3. ✅ Check the logs for error messages
4. ✅ Try the solutions above
5. ✅ Restart your development environment

### **When Asking for Help**
Include:
- **Error message** (copy/paste the full error)
- **Your OS and version**
- **Node.js and Rust versions**
- **Steps to reproduce**
- **What you've already tried**

### **Resources**
- [Tauri Documentation](https://tauri.app/docs)
- [React Documentation](https://react.dev/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Team Slack Channel](#polka-dev)

---

**Still stuck? Don't hesitate to ask for help! We're all here to support each other.** 🚀
