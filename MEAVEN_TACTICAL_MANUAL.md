# Meaven Intelligence (MI): Strategic Operator's Manual

## 🌐 Overview
**Meaven Intelligence (MI)** is a high-fidelity, data-driven execution platform designed for **Meaven** to manage premium design, architecture, and project execution. Built for lean project management and vendor orchestration, MI transitions complex buildouts into manageable tactical loops. It provides real-time visibility from initial site audits to global financial EBITDA, acting as the ultimate digital war room.

---

## 🔐 1. Security, Authorization & Stealth Mode
The platform utilizes a multi-layered defense architecture to ensure data integrity, confidentiality, and professional presentation.

*   **Primary Access**: Secure email/password login powered by Supabase.
*   **Stealth Toggle (Internal vs. Client View)**: The dashboard acts as a dual-facing hub. 
    *   **Internal Tactical Mode**: Displays raw financials, GP Margins, and vendor COGS.
    *   **Secure Portfolio Mode**: Requires a Client PIN to access a clean, unbranded view displaying only project progress and site readiness—shielding your vendor costs and profit margins.
*   **Master Key**: A universal master key (`210805`) allows executive override.
*   **Automated Audit Trail**: Every login and major action is automatically logged in the timeline.

---

## 📊 2. Command Center (Tactical Dashboard)
*The macro-intelligence dashboard designed for high-density, executive oversight.*

*   **High-Density Tactical Strips**: Replaces bulky cards with streamlined horizontal data rows showing:
    *   **Identity Pulse**: Project Name, Location, and Start Date.
    *   **Financial Grid**: Revenue (REV), Contract Value (CON), and Real-time GP Margin %.
    *   **Timeline Tracker**: Prioritized deadlines mapping **MEA➜CLT** (Meaven to Client delivery) and **VND➜MEA** (Vendor to Meaven preceding deadline).
    *   **Execution Hub**: Instantly identifies the assigned partner and the site readiness percentage.
*   **Dynamic Portfolio Headers**: Groups projects by client and auto-detects the assigned vendor partner. Warns you if a portfolio is "PARTNER PENDING" or managed by "MULTIPLE PARTNERS."
*   **Live Synchronization**: Features a global system clock and standardizes all dates to `DD-MM-YYYY`.

---

## 📁 3. Operations Hub (Project Central)
*The unified workspace for project-level tactical management, directly linked from the Command Center.*

*   **Financial Intelligence (P&L)**: Dual-track ledger capturing:
    *   **Client Revenue**: Track received payments with transaction IDs and dates.
    *   **Vendor Payouts**: Precise tracking of money disbursed to partners, deeply integrated with the Vendor Bench.
*   **Intelligence Timeline**: A timeline capturing every update. Internal tactical notes remain hidden, while success milestones can be pushed to the client view.
*   **Readiness Guard (Safety Barrier)**: Projects scoring below 40% on the readiness audit are automatically flagged as "EXECUTIVE HALTED" in the Action Center to prevent costly execution errors.

---

## 🤝 4. Partner Bench & Orchestration
*The engine for lean outsourcing management and intelligent reassignment.*

*   **Intelligent Partner Detection**: The system cross-references all active contracts to determine who is operating a site. 
*   **Emergency Reassignment Engine**: If a vendor fails, the "Replace" function triggers an automated orchestration sequence:
    1.  **Terminates** the active contract for the failing partner.
    2.  **Initializes** a new active contract for the replacement partner.
    3.  **Logs** the transition in the project history for absolute accountability.
*   **AI Bench Suggestions**: Automatically recommends the top three partners based on historical quality, speed, and precision metrics.

---

## 📈 5. Live Site Monitoring & SOS Reporting
*Bridging the gap between the field and the dashboard with secure, isolated reporting.*

*   **Secure Field Portal**: A dedicated, mobile-optimized terminal for site supervisors (`?view=field`).
    *   **Vendor Siloing**: Access is restricted by **Vendor-Specific PINs**. Partners only see the projects they are currently assigned to.
    *   **SOS Reporting Engine**: Supervisors can instantly report "Material Delays" or "Site Ready" alerts.
*   **📡 Live Execution Feed**: A real-time stream on the Command Center that pulses with new field reports. It is **fully interactive**—clicking an alert instantly transports the administrator to that project's Operations Hub.
*   **Site Readiness Scoring**: A 0-100% checklist covering civil, electrical, structural, and compliance checks. Projects below 40% are auto-flagged for halting.

---

## ☁️ 6. Technical Foundation & Infrastructure
*   **Core Engine**: Powered by **Supabase** for real-time database synchronization and secure authentication.
*   **Enterprise Hosting**: Migrated to **Cloudflare Pages** for unlimited bandwidth and zero-latency global delivery.
*   **SPA Routing Guard**: Engineered with a custom `_redirects` system to handle client-side routing, ensuring the app remains stable during page refreshes and deep-links.

---

**Operator Note**: Meaven Intelligence is designed to scale *revenue* without scaling *headcount*. Use the data to manage the vendors, and the platform to manage the data. The goal is relentless Operational Excellence.
