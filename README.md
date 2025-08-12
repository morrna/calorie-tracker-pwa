# 🍎 Calorie Tracker PWA

A simple, flexible, and offline-capable calorie tracking Progressive Web App built with React, TypeScript, and IndexedDB.

This app fills a gap in my experience of the calorie tracking landscape.
Commercial apps often demand a level of detail that doesn't match real life &mdash;
sometimes I want to meticulously log a home-cooked meal,
and sometimes I just need to quickly record "snack, about 200 calories" without friction.
Spreadsheets offer the flexibility I want but are painfully clunky on a phone.
This tracker aims to fill that gap:
flexible enough to handle both precise and approximate entries,
smart enough to remember your common foods and do the math for you,
and simple enough to use one-handed on your phone while you're actually eating.
It's designed for real-world use, where perfect data entry takes a backseat to sustainable habits.

## ✨ Features

- **📱 Install as Native App** - Works on mobile and desktop
- **💾 Automatic Persistence** - Data saved locally with IndexedDB
- **🔌 Offline Support** - Full functionality without internet
- **🎯 Smart Suggestions** - Learns your common foods and portions
- **📊 Daily Tracking** - View calories by date with running totals
- **📤 Import/Export CSV** - Backup data or analyze in spreadsheets
- **🎨 Mobile-First Design** - Responsive UI with Tailwind CSS
- **⚡ Fast & Lightweight** - Built with Vite for optimal performance

## 📱 Installation

### Mobile
1. Visit [the deployed site](https://morrna.github.io/calorie-tracker-pwa/) in Chrome (Android) or Safari (iOS)
2. Tap "Add to Home Screen" when prompted
3. Or use browser menu → "Add to Home Screen"

### Desktop
1. Look for install icon (⊕) in address bar
2. Or use browser menu → "Install Calorie Tracker"

## 🚀 Quick Start for Developers

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Build for Production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **IndexedDB** (via idb) - Local storage
- **Tailwind CSS** - Styling
- **Vite PWA Plugin** - PWA features
- **Lucide React** - Icons

## 📂 Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # React entry point
├── index.css        # Global styles
└── vite-env.d.ts    # TypeScript declarations

public/
├── icon-192.png     # PWA icon
├── icon-512.png     # PWA icon (large)
└── apple-touch-icon.png # iOS icon
```

## 🔧 Configuration

### Change Repository Name

If you fork this and deploy to a different URL,
update `base` in `vite.config.ts`:
```typescript
base: '/your-repo-name/',
```

### Customize Theme

Edit theme colors in `vite.config.ts`:

```typescript
theme_color: '#4f46e5',
background_color: '#ffffff',
```

## 💾 Data Storage

- **IndexedDB** for persistent local storage
- **Automatic saving** on every action
- **CSV export** for backups
- **CSV import** for data migration

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Create a fork

## 🙏 Acknowledgments

- Built with React and Vite
- Icons by Lucide
- Styling with Tailwind CSS
- Mobile icons created with Craiyon
- Drafted with Claude Opus 4.1 chat

## Author's note

This is a vibe coding experiment to see how quickly I could make something useful for daily life.
I was pleased with the prototype, but it didn't have persistence in its sandbox,
so I'm publishing it here as a progressive web app.
I make no promises as to its ongoing maintenance, but if you find it useful, I welcome your feedback!


---

**Live Demo:** [https://morrna.github.io/calorie-tracker-pwa/](https://morrna.github.io/calorie-tracker-pwa/)

