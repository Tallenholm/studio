# Logan's Excavating - Fleet & Operations Management

This document provides a comprehensive overview of the Logan's Excavating application, a full-featured operational management platform built with Next.js, Firebase, and Google's Generative AI.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Core Technologies](#core-technologies)
3.  [User Roles & Permissions](#user-roles--permissions)
4.  [Feature Breakdown](#feature-breakdown)
    - [Administrator Portal](#administrator-portal)
    - [Employee Portal](#employee-portal)
    - [Shared Features](#shared-features)
5.  [AI-Powered Features](#ai-powered-features)

---

## 1. Project Overview

This application is an all-in-one solution designed to streamline the daily operations of Logan's Excavating & Snow Removal. It provides tools for everyone in the company, from owners and managers to employees in the field, to manage jobs, assets, personnel, and communications efficiently.

The platform is divided into two main portals: an **Admin Portal** for management and a focused **Employee Portal** for field operations.

## 2. Core Technologies

- **Frontend:** Next.js, React, TypeScript
- **UI:** ShadCN UI, Tailwind CSS
- **Backend & Database:** Firebase (Firestore, Authentication, Storage)
- **Generative AI:** Google's AI Platform via Genkit
- **Weather API:** ECMWF

---

## 3. User Roles & Permissions

The application has a robust role-based access control system:

- **Owner:** Full system access. Can manage all aspects of the business, including users, clients, jobs, financials, and system settings. This is the only role that can change other users' roles.
- **Manager:** Day-to-day operational control. Can manage tasks, reports, documents, and fleet assets. Cannot access sensitive owner-level pages like financials, user management, or client management.
- **Employee:** Focused access for field operations. Can perform vehicle inspections, complete assigned tasks, view their job assignments and snow routes, request time off, and submit expenses.
- **Guest:** Unauthenticated user. Can only see the login page.

---

## 4. Feature Breakdown

### Administrator Portal (`/admin`)

The central hub for managing all business operations.

#### **Dashboard & Core Tools**
- **AI Daily Briefing:** An intelligent summary of the day's most critical items, including failed inspections, pending requests, and scheduled jobs.
- **Operations Calendar:** An interactive calendar showing all scheduled jobs, company events, and approved time off.

#### **Weather Center**
- A dedicated page featuring a live, multi-layer weather radar (rain, snow, wind) and detailed hourly and 7-day forecasts powered by the ECMWF API.

#### **People & Communications**
- **Manage Employees:** (Owner only) View all registered users and securely send password reset emails.
- **Manage Time Off Requests:** Approve or deny employee requests for time off. Approved requests are automatically added to the calendar.
- **Manage Expenses:** (Owner only) Review, approve, or deny employee expense submissions.
- **Manage Tasks:** Assign one-off tasks to employees (e.g., "Clean truck cab") and track their completion, including photo verification.
- **Manage Violations:** Log and track employee violations for safety, conduct, or performance for internal records.
- **Send Notifications:** Broadcast messages to all employees or send a targeted notification to a specific user.

#### **Assets & Content**
- **Manage Fleet:** Add, edit, and remove all company assets (trucks, trailers, heavy equipment). Track VINs, registration/insurance due dates, and set preventative maintenance schedules.
- **Fleet Health:** An AI-powered dashboard that calculates a "health score" for each asset based on recent inspections and maintenance logs, providing a quick overview of fleet condition.
- **Manage Inventory:** Track company inventory, including tools, materials, and consumables. Assign items to jobs, employees, or vehicles and monitor their status (Available, In Use, Maintenance).
- **Policies & Documents:** A central repository for company-wide documents (e.g., safety manuals) and sensitive employee-specific forms (e.g., W-2s, I-9s).
- **Manage Calendar:** Add company-wide events to the Operations Calendar.

#### **Operations & Analytics**
- **Manage Clients:** (Owner only) Maintain a central list of all clients.
- **Job Management (Excavation, Snow, Concrete, Misc.):** (Owner only) Create, edit, and manage all jobs, separated by type. Assign personnel and fleet, track job value, and view job-specific notes.
- **Job Cost Analysis:** On the details page for any job, you'll find the 'Job Cost Analysis' section. It provides an estimated profit or loss by automatically calculating and subtracting operational costs (labor for all assigned crew, maintenance for assigned vehicles during the job's timeframe, and other expenses) from the total job value. This gives you a clear financial picture for each project.
- **Manage Rentals:** (Owner only) Create and track equipment rentals to third parties.
- **Manage Snow Routes:** (Admin) Group snow contracts, personnel, and vehicles into efficient routes for plowing, salting, and sidewalks.
- **View Inspection Reports:** A list of all submitted pre-trip and post-trip inspection reports.
- **Manage Work Orders:** View and manage work orders automatically generated from failed inspections. Track status, add mechanic notes, and log costs.
- **View Maintenance Logs:** A complete service history for all fleet assets. Logs are created automatically when a Work Order is completed.
- **Advanced Reports:** (Owner only) A powerful analytics dashboard with customizable charts for visualizing inspection outcomes, maintenance costs, frequent failures, and more.

#### **System & Tools**
- **System Settings:** (Owner only) Configure global application settings, including appearance, notification preferences, and the default location for weather forecasts.
- **Calculators:** A suite of specialized calculators for project estimation (Concrete, Asphalt, Gravel, Labor Cost, etc.).

---

### Employee Portal (`/employee`)

A streamlined interface for field staff.

- **Employee Hub:** The main landing page showing key tools and an overview of assigned jobs.
- **Vehicle Inspections:** Perform mandatory Pre-Trip and Post-Trip inspections for trucks, trailers, and heavy equipment using a guided checklist.
- **Snow Routes:** A real-time view of assigned snow removal contracts for the current event. Employees can log service completion (plow, salt, etc.) to keep the team in sync.
- **My Tasks:** View and complete tasks assigned by administrators, with support for photo verification.
- **Time Off:** Submit requests for time off and view the status of past requests.
- **Submit Expense:** Submit expenses for reimbursement by uploading a receipt photo, which is automatically scanned by AI.
- **Company & Personal Documents:** Access general company policies as well as secure, personal documents like tax forms.
- **My Violations:** A confidential view of the employee's own violation history.

---

### Shared Features

- **Authentication:** Secure login via email/password or Google Sign-In, managed by Firebase Authentication.
- **Notifications:** A centralized page to view all system alerts and messages from administrators. Unread notifications are badged in the sidebar.
- **Help & Support:** An FAQ page and an AI-powered assistant available on every screen to answer questions about using the application.
- **Command Palette:** A global search tool (accessible via `Cmd/Ctrl+K`) to quickly navigate to any page, job, or client.

---

## 5. AI-Powered Features

The application leverages Google's Generative AI (via Genkit) to provide intelligent assistance and automate tedious tasks.

- **AI Daily Briefing:** Synthesizes data from across the app to create a prioritized daily summary for administrators.
- **AI Job Creation:** (Admin) Parses natural language prompts (e.g., "Plow the lot for...") to automatically create structured job entries, pre-filling client, address, and date information.
- **Receipt OCR:** (Employee) Scans an uploaded receipt image to automatically extract the total amount, date, and merchant, speeding up expense submissions.
- **Document Summarization:** (Admin) Analyzes an uploaded document image and suggests a concise title and description to pre-fill form fields.
- **AI Anomaly Detection:** (Admin) Compares a new vehicle inspection report against historical reports for the same vehicle to flag unusual patterns or potential maintenance issues.
- **AI-Optimized Snow Routes:** (Employee) Intelligently sequences a list of snow removal jobs based on geographic proximity, business hours, and special equipment needs, providing an optimized route plan.
- **Preventative Maintenance Scheduling:** (Admin) Suggests a standard maintenance schedule (e.g., oil changes, tire rotations) based on a vehicle's year, make, and model.
- **AI Help Assistant:** A conversational agent trained on the application's FAQ data to provide instant, context-aware support to any user.
