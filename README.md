# 📍 CivicPulse

**Report. Verify. Resolve.**

![Status](https://img.shields.io/badge/status-live-brightgreen)
![Built with Gemini](https://img.shields.io/badge/AI-Gemini%20API-8E75B2)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB)
![Node](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933)

CivicPulse is a hyperlocal civic responsiveness and grievance-routing platform I'm building for modern Indian cities, designed around Bengaluru's BBMP ward system. Citizens snap photo proof of civic issues — potholes, water leaks, broken streetlights, garbage overflow — and Google Gemini AI auto-diagnoses the hazard, scores its severity, and routes it to the correct municipal department (PWD, BWSSB, BESCOM, BBMP), all tracked against live SLA timers.

**🔗 Live demo:** [civicpulse-372046801993.asia-southeast1.run.app](https://civicpulse-372046801993.asia-southeast1.run.app/)

---

## 📸 Preview

> _Add a hero screenshot and a short GIF of the 4-step report wizard here._

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS v4, TypeScript |
| Backend | Node.js, Express, esbuild (CJS bundling) |
| AI | Google Gemini API (vision + text) |
| Auth & Storage | Firebase |
| Maps | Leaflet.js, CartoDB tile layers, Leaflet.markercluster, Leaflet.heat |
| Deployment | Google Cloud Run |

---

## 🚀 Key Features

### ⚡ AI-Powered Grievance Wizard
- **4-step guided reporting** — image upload, GPS pin, AI-assisted categorization, review and submit
- **Gemini diagnostics** — real-time analysis of uploaded proof returning hazard category, severity score (1–5), and department routing
- **Anonymous reporting** — privacy-focused toggle, no account required
- **SLA countdown timer** — live countdown derived from severity score and a monsoon-season coefficient

### 🗺️ Hyperlocal Map Explorer
- **Marker clustering** for dense issue areas, optimized for performance
- **Heatmap overlay** showing city-wide hazard density on CartoDB base layers
- **Floating filters** — category, status, and ward, applied instantly
- **Side sheet detail view** — click any pin to see photo proof, geocoded address, and dispatcher notes

### 🔄 Before & After Gallery
- **Comparison slider** for original complaint vs. resolution proof photos
- **Deep-linkable sharing** via `/issues/:id`
- **Ward and category filtering**

### 🔗 Routing
- Clean client-side paths: `/`, `/map`, `/report`, `/issues/:id`, `/dashboard`, `/leaderboard`, `/insights`, `/gallery`
- Full browser back/forward support without page reloads

### 🎨 Design
- Class-based dark mode with custom type pairing (Inter, Space Grotesk, JetBrains Mono)
- Glassmorphism navigation header with live streak counter

---

## 📂 Project Structure

```
civicpulse/
├── assets/.aistudio/    # AI Studio project metadata
├── src/                 # React + Vite frontend source
├── .env.example
├── .gitignore
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
├── index.html
├── metadata.json
├── package.json
├── server.ts            # Express backend
├── tsconfig.json
└── vite.config.ts
```

---

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Gemini AI Studio API key (server-side only — never expose to client)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase web app config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 📦 Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (Express + Vite middleware, http://localhost:3000)
npm run dev

# 3. Build for production
npm run build
# → Vite bundles frontend to /dist
# → esbuild compiles backend to /dist/server.cjs

# 4. Run production build
npm run start
```

---

## ☁️ Deployment (Google Cloud Run)

- [ ] `package.json` build scripts target `/dist`
- [ ] All secrets declared in `.env` (never committed) and mirrored in `.env.example`
- [ ] `<title>` and favicon set in `index.html`
- [ ] Gemini API calls happen only in server-side routes (`/api/*`) — key never reaches the client bundle
- [ ] Leaflet CSS/JS loaded via HTTPS CDN with integrity hashes
- [ ] Cloud Run service configured with environment secrets via Secret Manager

---

## 🗺️ Roadmap

Planned for future iterations:

- [ ] WhatsApp-based reporting for low-smartphone-literacy users
- [ ] Offline PWA support with background sync
- [ ] Multilingual input (Kannada, Hindi, Tamil)
- [ ] Official municipal dashboard with SLA breach alerts
