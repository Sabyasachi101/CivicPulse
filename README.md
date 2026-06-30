# CivicPulse — Report. Verify. Resolve.

CivicPulse is an advanced hyperlocal civic responsiveness and grievance routing platform for modern Indian cities (designed for Bengaluru BBMP wards). Powered by Google Gemini AI, it enables citizens to snap photo proof of civic issues, auto-diagnose hazards, track municipal repair progress with strict SLA timers, and explore interactive maps of active issues.

📍 **Live URL:** https://civicpulse-372046801993.asia-southeast1.run.app

---

## 🚀 Key Features

### 1. ⚡ AI-Powered Grievance Wizard
- **Step-by-Step Reporting:** A fluid 4-step wizard simplifying image uploads and GPS selection.
- **Gemini Diagnostics:** Real-time AI analysis of uploaded proof (potholes, garbage, water leaks, streetlights) returning automated categorization, hazard severity scoring (1-5), and department routing (PWD, BWSSB, BESCOM, BBMP).
- **Anonymous Reporting:** Optional toggle for privacy-focused report filing.
- **SLA Countdown Timer:** Live target SLA countdown clocks based on hazard severity and Monsoon coefficient.

### 2. 🗺️ Hyperlocal Map Explorer
- **Marker Clusters:** Grouping dense markers dynamically using clustering algorithms to ensure performance.
- **Heatmap Overlay:** Toggling city-wide visual thermal hazard densities on top of CartoDB map layers.
- **Floating Filters:** Instant dashboard filtering on the map by Category checkboxes, Status pills, and Ward zones.
- **Collapsible Sidewalk Sheet:** Click any pin on the map to expand a rich summary tray detailing original photo proof, geocoded address, and dispatcher notes.

### 3. 🔄 Before & After Transformation Gallery
- **Comparison Slider:** Custom swipe-to-compare drag bar allowing side-by-side visualization of original complaints vs. municipal resolution proof photos.
- **Sharing Tool:** Copies deep-linkable URLs (`/issues/:id`) directly to clipboard for local sharing.
- **Zone Filtering:** Dropdowns to narrow transformations by BBMP wards and category tags.

### 4. 🔗 Advanced Pathname Router
- **Synced Deep Linking:** Clean address bar paths (`/`, `/map`, `/report`, `/issues/:id`, `/dashboard`, `/leaderboard`, `/insights`, `/gallery`) render their corresponding UI instantly.
- **Popstate Resiliency:** Native forward/back browser buttons synchronize state flawlessly without page refreshes.

### 5. 🎨 Visual Craftsmanship
- **Aesthetic Dark Mode:** A class-based dark mode (`.dark`) using custom typography pairing (Inter, Space Grotesk, JetBrains Mono) with Tailwind CSS v4 variables.
- **Sticky Blur Capsule:** Transparent glassmorphism header navigation bar with active state outlines and real-time citizen reporting streak counts.

---

## 🛠️ Environmental Settings (`.env.example`)

Make sure the following variables are specified in your system or workspace:

```env
# Gemini AI Studio API Key (Server-side exclusive)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Application Client Configurations
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 📦 Local Setup Instructions

Follow these simple steps to run CivicPulse locally on your machine:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Boot the full-stack development server:**
   ```bash
   npm run dev
   ```
   *The Express backend proxies Vite middleware to serve client assets on `http://localhost:3000`.*

3. **Build the codebase for production:**
   ```bash
   npm run build
   ```
   *Vite bundles frontend assets under `/dist`, while `esbuild` compiles TypeScript backend controllers into CJS under `/dist/server.cjs`.*

4. **Launch production server:**
   ```bash
   npm run start
   ```

---

## 📋 Deployment Checklist

- [x] Verify `package.json` build commands target standard output folders (`/dist`).
- [x] Declare all secret variables cleanly in `.env.example`.
- [x] Set `<title>` tag and custom civic map-pin favicon in `index.html`.
- [x] Secure sensitive API operations (such as Gemini analyses) in server-side routes (`/api/*`) rather than exposing API keys on the client-side.
- [x] Ensure Leaflet CSS/JS assets are pulled via reliable CDNs with HTTPS integrity hashes.
