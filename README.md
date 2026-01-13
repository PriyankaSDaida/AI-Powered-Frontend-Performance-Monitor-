# AI-Powered Frontend Performance Monitor

A self-hosted, full-stack performance monitoring system for modern web applications. Designed to capture Real User Metrics (RUM), JavaScript errors, and provide actionable insights via a dedicated dashboard.

---

## 🏗 High-Level Architecture

The system consists of three main components data flow:

1.  **Client Application**: The user's web app with our lightweight SDK initialized.
2.  **Ingestion & Storage**: A Next.js API route receiving batched events and storing them in an optimized SQLite database.
3.  **Visualization**: A Dashboard for viewing trends, errors, and performance scores.

```mermaid
graph TD
    subgraph Client ["Client Browser (User App)"]
        UserApp["User Application"]
        SDK["AI Monitor SDK"]
        UserApp -->|Mounts| SDK
        SDK -->|Captures| Vitals["Web Vitals (LCP, CLS, INP)"]
        SDK -->|Captures| Errors["JS Errors & Promise Rejections"]
        SDK -- "Batches & Flushes (JSON)" --> Network
    end

    subgraph Server ["Monitoring Platform (Next.js)"]
        IngestAPI["/api/ingest (POST)"]
        Dashboard["Dashboard UI"]
        DB[("SQLite Database")]
        
        Network -->|Sends Events| IngestAPI
        IngestAPI -->| "writes (uuid, payload)" | DB
        Dashboard -->| "queries (aggregates)" | DB
    end
```

---

## 🚀 Key Features

*   **Real-User Monitoring (RUM)**: Automatically captures Core Web Vitals (LCP, CLS, INP) and Time to First Byte (TTFB).
*   **Error Tracking**: Catches uncaught exceptions and unhandled promise rejections with stack traces.
*   **Smart Buffering**: Events are batched and sent periodically to minimize network overhead.
*   **Privacy-First**: No PII collected by default; data stays on your infrastructure.
*   **Zero-Config Dashboard**: clear, detailed visualization of your app's health out of the box.

---

## 🛠 Tech Stack

*   **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Database**: `better-sqlite3` (Embedded, fast for MVP)
*   **Styling**: Tailwind CSS
*   **Charts**: Recharts

---

## 🏁 Getting Started

### 1. Prerequisites
*   Node.js 18+ installed
*   Git

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone git@github.com:PriyankaSDaida/AI-Powered-Frontend-Performance-Monitor-.git
cd AI-Powered-Frontend-Performance-Monitor-
npm install
```

### 3. Running the Server with Dashboard
Start the development server. This runs both the **Ingestion API** and the **Dashboard**:

```bash
npm run dev
```
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the monitoring dashboard.

---

## 🔌 SDK Integration Guide

To monitor your own React/Next.js application, you need to integrate the SDK.

### Option A: Using the Component (Recommended for React)
Copy the `src/sdk` and `src/components/MonitorInit.tsx` to your project and import the component in your root layout.

```tsx
import MonitorInit from '@/components/MonitorInit'; 

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Initialize Monitoring */}
        <MonitorInit />
        
        {children}
      </body>
    </html>
  );
}
```

### Option B: Manual Initialization
If you are using vanilla JS or a different framework, initialize the class directly:

```typescript
import { initMonitor } from './sdk';

initMonitor({
  appId: 'my-awesome-app',
  ingestUrl: 'http://localhost:3000/api/ingest', // Point to your running monitor instance
});
```

---

## 🐳 Database Management

The project uses a local SQLite file named `monitoring.db`.
*   The database is automatically created on the first run.
*   To reset data, simply delete the `monitoring.db` file and restart the server.

```bash
rm monitoring.db && npm run dev
```

---

## 📜 License
MIT
