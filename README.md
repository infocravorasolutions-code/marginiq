# MarginIQ — The Single Operating System for E-Commerce Businesses

MarginIQ is the operating system for e-commerce businesses selling across marketplaces (Amazon, Flipkart, Meesho, and D2C). It manages product economics, landed costs, marketplace fee calculations, price recommendations, and bank settlement reconciliations.

## Project Architecture

- **`frontend/`**: Modern React + TypeScript + Vite + Tailwind CSS dashboard application.
- **`backend/`**: Node.js + TypeScript + Express + MongoDB REST API handling fee engines, calculation snapshots, settlement reconciliation, and inventory tracking.
- **`docs/`**: Comprehensive product requirements, data flows, and system architecture guides.

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (running locally or MongoDB Atlas)

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/infocravorasolutions-code/marginiq.git
   cd marginiq
   ```

2. **Environment Configuration:**
   Copy the `.env.example` file to `.env` in both the root/backend directories:
   ```bash
   cp .env.example backend/.env
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npm run build
   npm run dev
   ```

4. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## Documentation

- [`SYSTEM_GUIDE.md`](./SYSTEM_GUIDE.md) — Master architectural blueprint and operational guide.
- [`PRD.md`](./PRD.md) — Detailed Product Requirements Document.

