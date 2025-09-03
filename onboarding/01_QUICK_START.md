# ⚡ Quick Start Guide

**Need to get up and running fast? Follow these steps:**

## 🚀 5-Minute Setup

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Start Development**
```bash
# For web-only development (faster)
npm run dev

# For full desktop app development
npm run tauri dev
```

### 3. **Open in Browser/App**
- **Web mode**: Navigate to `http://localhost:1420`
- **Desktop mode**: The app window will open automatically

## 🔧 Common Commands

| What you want to do | Command |
|---------------------|---------|
| **Develop UI components** | `npm run dev` |
| **Test full app features** | `npm run tauri dev` |
| **Build for production** | `npm run build` |
| **Build desktop app** | `npm run tauri build` |
| **Preview production build** | `npm run preview` |

## 📱 App Installation vs Terminal Usage

**Want to install as a permanent app?**
```bash
# Build the desktop installer
npm run tauri build

# Install the generated DMG file:
# src-tauri/target/release/bundle/dmg/polka_0.1.0_aarch64.dmg
```

**Prefer using from terminal only?**
```bash
# Web browser mode (recommended)
npm run dev

# Desktop window mode (for native features)
npm run tauri dev
```

**To uninstall the app:**
```bash
rm -rf /Applications/polka.app
```

## 🐛 Quick Fixes

**Port already in use?**
```bash
lsof -ti:1420 | xargs kill -9
```

**Build errors?**
```bash
npm run tauri clean
npm run tauri dev
```

**Node modules issues?**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 What's Next?

1. **Read the full onboarding guide**: `onboarding/README.md`
2. **Explore the codebase**: Start with `src/App.tsx`
3. **Make your first change**: Edit a component and see it update in real-time

---

**That's it! You're ready to code! 🎉**
