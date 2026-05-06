# NoxReach: Technical Development Brief & Audit Findings

**Date:** May 04, 2026
**Status:** Pre-Launch Audit Complete
**Target User:** Independent DJs (Self-managed)

---

## 1. Critical Pre-Launch Fixes (Priority 1)

These issues were identified during the audit and must be resolved before the public launch to ensure legal compliance and core functionality.

| Feature | Issue | Required Action |
| :--- | :--- | :--- |
| **GDPR Compliance** | Broken legal links on landing page and in-app sidebar. | Ensure `Privacy Policy`, `Impressum`, and `Terms` links point to actual, readable documents. |
| **Calendar Sync** | "+ Add to calendar" button in the prompt does not populate the calendar view. | Debug the event handler for the "Add to calendar" action to ensure the gig is correctly saved to the database and rendered. |
| **UI Feedback** | No visual confirmation when clicking "Copy Template" or "Copy Reply". | Implement a toast notification or temporary button state change (e.g., "Copied!") to confirm success. |

---

## 2. Feature Roadmap & Tiering Strategy

The following features are proposed to transition NoxReach from a specialized CRM to a comprehensive "Nightlife OS."

### Free Tier (Core Outreach & Tracking)
*   **Lead Limit:** Cap at 15 active leads.
*   **Manual Hub:** Basic Reply Hub for logging manual entries.
*   **Basic Templates:** Access to the "Berlin" and "Circuit" templates.
*   **PWA Support:** Implement Progressive Web App capabilities for mobile access.
*   **Bulk Actions:** Enable multi-select for archiving or tagging leads.

### PRO Tier (Automation & Business Management)
*   **Unlimited Leads:** Remove all caps on the pipeline.
*   **Communication Sync:**
    *   **Email Integration:** Sync with Gmail/Outlook to auto-log replies.
    *   **Instagram DM Integration:** Direct tracking of IG conversations via API.
*   **Financial Suite:**
    *   **Contract Generator:** Standard DJ performance contracts with e-signature.
    *   **Automated Invoicing:** Generate invoices upon marking a gig as "Booked."
*   **Logistics:**
    *   **Itinerary Manager:** Store flight, hotel, and technical rider info per gig.
    *   **Expense Tracker:** Log travel and business expenses.
*   **Professional Assets:**
    *   **Dynamic Web EPK:** A hosted, auto-updating press kit for promoters.
*   **Advanced Analytics:** Conversion funnel insights and outreach performance benchmarks.

---

## 3. Technical Considerations for Developers

### API Integrations
*   **Instagram Graph API:** Required for DM sync and profile tracking.
*   **Stripe/Paddle:** For handling PRO subscriptions and potentially the invoicing feature.
*   **Google/Outlook Calendar APIs:** For two-way calendar synchronization.
*   **HelloSign/DocuSign API:** For the contract e-signature workflow.

### Performance & UX
*   **Optimistic UI:** Ensure pipeline movements and status updates feel instantaneous.
*   **Offline Mode:** Use service workers (via PWA) to allow DJs to check their itinerary or add leads while at venues with poor connectivity.
*   **Dark Mode Optimization:** Maintain the high-contrast, nightlife-themed aesthetic while ensuring accessibility (WCAG compliance).

---

## 4. Audit Scores Summary

*   **Onboarding:** 9/10
*   **Core Flow:** 9/10
*   **Copy & Messaging:** 8/10
*   **Pricing Clarity:** 8/10
*   **GDPR Compliance:** 4/10 (Critical Fix Required)
*   **Overall Launch Readiness:** 8.5/10 (Post-PRO Audit)

---
**Prepared by:** Manus AI Audit Team
