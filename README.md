📍 CivicPulse

Report. Verify. Resolve.

Show Image
Show Image
Show Image
Show Image

CivicPulse is an advanced, full-stack, AI-powered citizen grievance and municipal routing platform tailored for modern Indian cities (optimized for Bengaluru BBMP and New Delhi wards). By bridging the gap between urban citizens and public departments (like PWD, BWSSB, BESCOM, and municipal corporations), CivicPulse streamlines the entire lifecycle of urban concerns — from photo reporting and auto-diagnosis to live SLA tracking and verified field resolutions.

🔗 Live demo: civicpulse-372046801993.asia-southeast1.run.app


🧱 Tech Stack

LayerTechnologyFrontendReact, Vite, Tailwind CSS v4, TypeScriptBackendNode.js, Express, esbuild (CJS bundling)AIGoogle Gemini API (vision + text)Auth & StorageFirebaseMapsLeaflet.js, CartoDB tile layers, Leaflet.markercluster, Leaflet.heatDeploymentGoogle Cloud Run


🚀 Key Features

⚡ AI-Powered Grievance Wizard


Progressive 4-step form — guides citizens through visual proof upload, precise coordinate mapping, category description, and final metadata confirmation
Gemini multimodal diagnostics — sub-second AI assessment of uploaded photos (potholes, garbage piles, water-logging, broken streetlights) returning categorized departments, hazard severity ratings (1–5), and dynamic target SLAs
Anonymous reporting — privacy-focused toggle, no account required
Monsoon SLA coefficients — automatically adjusts and scales resolution deadlines during high-risk monsoon seasons (e.g. flagging water-drainage emergencies with a critical 6-hour dispatch timer)


🗺️ Hyperlocal Map Explorer


High-performance canvas — interactive map rendering with Leaflet, custom ward polygons, marker cluster grouping, and togglable heatmaps to visualize city-wide concern density
Floating context filters — real-time filtering by hazard category, resolution status, or ward region
Collapsible sliding drawer — swipe-up or click pins to inspect detailed issue summaries, geocoded street addresses, and dispatcher progress logs


🔗 Real-Time Grievance Details & Sharing


Deep-linkable sharing — generates /issues/:id paths copyable to clipboard for local community sharing and civic accountability
Real-time status updates — detailed grievance view with comments, dynamic SLA status tracking, and department assignments


📈 Official Analytics & Performance Leaderboards


Ward performance index — tracks and publishes ward rankings based on average response time, issue completion rates, and total active resolutions
Citizen gamification — tracks continuous reporting streaks and gamified community contribution points for active local citizens




🔗 Routing


Clean client-side paths: /, /map, /report, /issues/:id, /dashboard, /leaderboard, /insights, /gallery
Full browser back/forward support without page reloads


🎨 Design


Class-based dark mode with custom type pairing (Inter, Space Grotesk, JetBrains Mono)
Glassmorphism navigation header with live streak counter



⚡ Architectural & Latency Optimizations

To ensure a responsive, mobile-first experience, the platform integrates several performance enhancements:

Ultra-Fast AI Diagnostics


Client-side downsampling — large camera images are resized in-browser via HTML5 Canvas before transport, restricted to a max of 800px and compressed to JPEG (0.75 quality), drastically reducing payload sizes
Gemini minimal inference — ThinkingLevel.MINIMAL integrated into the server-side @google/genai model calls, bypassing unnecessary reasoning loops for visual categorization and cutting AI processing latency by over 60%


Failure-Resilient Backend APIs


Robust statistics engine — /api/dashboard/stats calculations in server.ts include strict validation boundaries and explicit fallbacks for missing historical records (absent statusHistory, blank createdAt, empty wards), ensuring stable rendering under all database states



📂 Project Structure

civicpulse/
├── .env.example                # Blueprint for required system keys (Gemini, Firebase)
├── .gitignore                  # Exclusion file for transient artifacts
├── firestore.rules             # Secure access configurations for Cloud Firestore
├── firebase-blueprint.json     # Initial database collections schema
├── firebase-applet-config.json
├── metadata.json
├── package.json                # Project dependencies, build scripts and tasks
├── server.ts                   # Express server entry point with REST endpoints
├── tsconfig.json                # Compile targets and module resolution rules
├── vite.config.ts               # Vite asset bundler configurations
├── index.html
├── assets/.aistudio/            # AI Studio project metadata
└── src/                         # Primary React application core
    ├── main.tsx                  # Client entry point
    ├── App.tsx                   # Base router and layout manager
    ├── index.css                 # Global styling, Tailwind imports & custom themes
    ├── types.ts                  # TypeScript interfaces (Issue, Location, User, Comment)
    ├── components/                # Reusable UI modules
    │   ├── ImpactDashboard.tsx     # City performance metrics & graphs
    │   ├── InsightsPage.tsx        # Predictive AI hotspots and recommendations
    │   ├── IssueDetailPage.tsx     # Detailed grievance view, SLA counter, comments
    │   ├── LandingPage.tsx         # Landing view with stats ticker
    │   ├── LeaderboardPage.tsx     # Ward performance leaderboards
    │   ├── LoginPage.tsx           # Unified authentication portal
    │   ├── MapComponent.tsx        # Map interface with heatmaps & cluster arrays
    │   ├── OfficialDashboard.tsx   # Dispatcher console & status updater
    │   ├── ProfilePage.tsx         # User contribution trackers
    │   └── ReportPage.tsx          # Compression-enabled 4-step wizard
    └── lib/                       # Core infrastructure utilities
        ├── firebase.ts             # Firebase SDK clients and initialization
        ├── geminiServer.ts         # Gemini API wrapper and schemas
        ├── indiaGeography.ts       # Regional geocoding datasets and ward mapping
        └── seedData.ts             # Initial records to bootstrap civic databases


⚙️ Environment Variables

Create a .env file based on .env.example:

env# Gemini AI Studio API key (server-side only — never expose to client)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase web app config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id


📦 Local Setup

bash# 1. Install dependencies
npm install

# 2. Start the dev server (Express + Vite middleware, http://localhost:3000)
npm run dev

# 3. Build for production
npm run build
# → Vite bundles frontend to /dist
# → esbuild compiles backend to /dist/server.cjs

# 4. Run production build
npm run start


☁️ Deployment (Google Cloud Run)


 package.json build scripts target /dist
 All secrets declared in .env (never committed) and mirrored in .env.example
 <title> and favicon set in index.html
 Gemini API calls happen only in server-side routes (/api/*) — key never reaches the client bundle
 Leaflet CSS/JS loaded via HTTPS CDN with integrity hashes
 Cloud Run service configured with environment secrets via Secret Manager



🔒 Verification & Compliance


TypeScript type safety — all components fully typed, compiled via tsc --noEmit
Server-side API security — Gemini model integration is fully encapsulated on the server (server.ts / src/lib/geminiServer.ts), preventing leakage of keys or system prompts to client browsers



🗺️ Roadmap

Planned for future iterations:


 WhatsApp-based reporting for low-smartphone-literacy users
 Offline PWA support with background sync
 Multilingual input (Kannada, Hindi, Tamil)
 Official municipal dashboard with SLA breach alerts
