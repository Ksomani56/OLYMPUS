# 🖥️ TrustFed Frontend — Interactive Financial Fraud Screening Platform

React 19 + TypeScript + Vite web platform delivering real-time federated risk assessments, interactive transaction sandboxes, and explainable AI insights.

---

## 🛠️ Tech Stack
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion, Canvas Confetti
- **Icons:** Lucide React
- **Data Visualization:** Recharts

---

## 📂 Project Structure

```
frontend/
├── public/                 # Static assets, fonts, and icons
├── src/
│   ├── assets/             # Images and SVG icons
│   ├── components/         # Reusable React components
│   │   ├── demo/           # Demo pitch helper bar
│   │   ├── hero/           # 3D stage and hero visuals
│   │   ├── pages/          # Main landing/intro page
│   │   ├── react-bits/     # Specialized UI animations and spotlight cards
│   │   ├── tabs/           # Dynamic navigation and tab headers
│   │   └── views/          # Tab views (Banks, Lenders, Insurers, Topology, etc.)
│   ├── constants/          # Static feature definitions
│   ├── services/           # Backend API communication clients
│   ├── App.tsx             # Root layout and application state
│   ├── main.tsx            # DOM bootstrap
│   └── index.css           # Global stylesheet and Tailwind directives
├── package.json            # Dependencies and scripts
└── vite.config.ts          # Vite configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 22+ LTS
- npm or yarn / pnpm

### 2. Installation
```bash
cd frontend
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Build for Production
```bash
npm run build
```
The compiled production bundle will be generated in `dist/`.
