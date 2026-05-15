# VendorIQ — Master Product Blueprint
**Context Reference ID:** `002632d4-4b1c-4149-b3e9-9973d4c653a0`
**Product Strategy:** Decoupled Architecture (One Admin, Two Frontends)

---

## 1. STRATEGIC ARCHITECTURE
- **Core Hub (Current)**: `hub.meaven.in` (Operations, P&L, Master Admin).
- **VendorIQ Portal (New)**: `vendoriq.meaven.in` (PM Subscriber Login, Vendor Database).
- **Unified Backend**: Shared Supabase instance to ensure data flows between Meaven Ops and VendorIQ Intel.

---

## 2. DATA ENTITIES (Shared via Supabase)
### VENDORS (VIQ_VENDORS)
- `lead_time_realistic` vs `lead_time_quoted`.
- `red_flags` (Warning flags for PMs).
- `verification_status` (Verified / Pending / Unverified).
- `rating` (Stars from PM reviews).

### SUBSCRIBERS (VIQ_SUBSCRIBERS)
- Role: `PMSubscriber`.
- Subscription status, company, and request history.

### SHORTLIST_REQUESTS
- PM-submitted requirements.
- Admin-fulfilled recommendations.

---

## 3. DESIGN SYSTEM (Bloomberg-Terminal Aesthetic)
- **Primary BG**: `#0A0E14` (Dark Navy).
- **Accent**: `#FFB800` (Amber).
- **Tone**: Professional, data-forward, utilitarian B2B tool.

---

## 4. ADMIN WORKFLOW (The Unified Brain)
- Admin management for VendorIQ happens **inside the Meaven Governance Console**.
- Features: Registration Inbox, Shortlist Fulfillment, Subscriber Management.
- No "double-login" for Ravi (Master Admin).

---

## 5. RECENT STATUS (Phase 1 Ready)
- Data structure defined.
- PM Login and Dashboard logic drafted.
- Public Registration form specs finalized.
- **Strict Rule**: Build locally. Only push to remote upon explicit user request.
