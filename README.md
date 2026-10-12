<<<<<<< HEAD
# DsArena — Full-Stack DSA Progress Tracking Platform

A modern, responsive full-stack telemetry and performance tracking platform for monitoring students' Data Structures & Algorithms (DSA) problem-solving consistency on **LeetCode** and **GeeksforGeeks (GFG)** across academic training batches (**Alpha**, **Beta**, **Gamma**, and future custom cohorts).

---

## 🚀 Key Features

### 🎓 Student Experience
- **Personal Dashboard**: Daily, weekly, and monthly problem breakdown, live streak counter, longest streak, and last active timestamp.
- **Interactive Visualizations**:
  - Weekly problem velocity (Mon–Sun bar chart)
  - Platform distribution donut chart (LeetCode vs GFG)
  - Difficulty distribution (Easy, Medium, Hard)
  - 90-day GitHub/LeetCode style contribution calendar heatmap
- **Platform Telemetry**: Connect public LeetCode and GeeksforGeeks handles with zero password exposure.
- **Competitive Leaderboard**: Global and batch-filtered rankings (Alpha, Beta, Gamma) with sprint filters (Overall, Monthly, Weekly) and medals.
- **Recent Activity Log**: Direct problem links, platform indicators, and solved timestamps.
- **Day-wise Activity**: Daily charts use timestamps from recorded solved problems; LeetCode submission-calendar counts are not treated as solved problems.

### 🛡️ Administrator & Instructor Portal
- **Organization Analytics Dashboard**: Total students, active today (last 24h), active this week (last 7d), inactive count, and solved metrics.
- **Cohort / Batch Management**: CRUD operations for student cohorts (Alpha, Beta, Gamma, or custom training groups) with batch-level averages.
- **Student Attendance & Status Monitoring**: Color-coded practice indicators:
  - 🟢 **Green** (`Active Today` — activity within 24h)
  - 🟡 **Yellow** (`Active This Week` — activity within 7 days)
  - 🔴 **Red** (`Inactive` — no activity in > 7 days)
- **Deep Student Inspection**: 30-day, 3-month, and 6-month historical activity charts and individual on-demand sync triggers.
- **Weekly Matrix Report**: Student-by-day matrix (Student vs Mon–Sun problem counts) with batch filters and export views.
- **Monthly Analytics**: Cohort comparison, top performers, zero-activity alerts, and monthly trends.
- **Multi-Admin RBAC**:
  - **Super Admin**: Full platform authority, admin management, batch management, system wiping.
  - **Admin**: Cohort management, reports, student inspection, and broadcasts.
  - **Moderator**: Read-only oversight for Teaching Assistants.
- **Announcement Broadcasts**: Send targeted announcements to all students or specific batches.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18/19, Vite, Tailwind CSS, React Router v6, Recharts, Lucide React, Axios |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Helmet, Express Rate Limit |
| **Integrations** | LeetCode GraphQL public adapter, GeeksforGeeks public profile and submissions APIs, legacy stats fallback |
| **Automation** | Node-Cron scheduled synchronization runner |

---

## 🧪 Empty and Development Data

A fresh database contains no students, administrators, batches, or progress records. No demo account is created when the API starts, and this repository does not provide production credentials.

The destructive sample-data and database-reset scripts are only for a local development database. Both require `NODE_ENV=development`, `ALLOW_DESTRUCTIVE_DEV_DB=true`, and a MongoDB URI whose host is localhost/127.0.0.1/::1. Never enable them against real student data.

---

## 📦 Getting Started & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/dsa_tracker`) or MongoDB Atlas URI.

### 2. Installation

Clone or open the project repository:

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Configure Environment Variables
# Copy backend/.env.example to backend/.env. Set MongoDB and generate different,
# cryptographically random JWT_SECRET and ADMIN_JWT_SECRET values (at least 32 characters).

# 3. Optional: seed fake records in a local development database only
$env:ALLOW_DESTRUCTIVE_DEV_DB='true'
npm run seed:dev

# 4. Install Frontend Dependencies
cd ../frontend
npm install
```

Generate distinct random `JWT_SECRET` and `ADMIN_JWT_SECRET` values with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. For first-admin bootstrap in local development, open the setup page on the backend computer; the six-digit one-time code is displayed on the page. In other environments, set `ADMIN_SETUP_EMAIL` to the authorized administrator mailbox; the code is printed only in the backend terminal. Codes expire after 10 minutes, allow at most five verification attempts, and are stored only as a keyed hash. Never expose the setup code or backend terminal to untrusted users. SMTP settings are only needed for password-reset and admin invitation emails. Initial student platform sync runs after signup and does not delay account creation. Configure `VITE_API_URL` only when the API is not served/proxied at `/api`.

In production, set `NODE_ENV=production`, provide `MONGO_URI` and strong, distinct JWT secrets, and use a MongoDB connection that supports TLS (TLS is enforced by the backend). Never commit `.env` files; store production secrets in the hosting provider's secret manager. Configure `TRUST_PROXY_HOPS` to the exact number of trusted reverse proxies in front of Express (leave it at `0` when there is no proxy), and set `FRONTEND_URL` to the exact comma-separated frontend origins. The API uses Zod request schemas plus controller-level validation, limits JSON bodies to 3 MB and URL-encoded bodies to 10 KB, rejects MongoDB operator/dotted-key input, and uses Helmet, origin checks, and request rate limits. For multi-replica deployments, configure a shared rate-limit store and an upstream WAF/CDN rather than relying on Express's per-process in-memory counters. Run `npm run audit:security` in `backend` and `npm audit --audit-level=high` in `frontend`; the security-audit workflow runs both lockfile audits on pushes, pull requests, and weekly.

Student and administrator accounts use separate MongoDB collections (`users` and `admins`), separate authentication endpoints, and separate session cookies. Student login only looks up student records; admin accounts are initialized through the one-time setup page and subsequently provisioned by a Super Admin.

### 3. Running the Application

You can run both backend and frontend servers:

```bash
# In backend terminal:
cd backend
npm run dev      # Runs Express API on http://localhost:5000

# In frontend terminal:
cd frontend
npm run dev      # Runs Vite app on http://localhost:5173
```

Now open **http://localhost:5173** in your browser.

---

## 📡 REST API Reference

### Student Authentication
- `POST /api/auth/register` — Register a student with batch, college, branch, and platform handles.
- `POST /api/auth/login` — Sign in with email and password.
- `GET /api/auth/me` — Retrieve current authenticated student profile.
- `POST /api/auth/logout` — Logout student session.

### Profile & Settings
- `GET /api/users/profile` — Full student profile with connected status.
- `PUT /api/users/profile` — Update name, branch, college, batch.
- `PUT /api/users/password` — Update student password.
- `GET /api/users/:id/public` — Public peer profile.

### Platform Integrations
- `POST /api/integrations/leetcode/connect` — Connect / update LeetCode handle.
- `POST /api/integrations/gfg/connect` — Connect / update GeeksforGeeks handle.
- `POST /api/integrations/disconnect` — Disconnect platform.
- `POST /api/integrations/sync` — Trigger immediate dual-platform sync for student.

### Progress & Metrics
- `GET /api/progress/me` — Full student analytics, weekly chart data, donut breakdown, and 90-day heatmap.
- `GET /api/progress/activity` — Paginated problem activity logs with platform filtering.

### Leaderboard
- `GET /api/leaderboard?batch=Gamma&timeframe=overall&search=Ayush` — Filtered leaderboard rankings.

### Batches
- `GET /api/batches` — List batches with student counts and averages.
- `POST /api/batches` — Create new training batch (Admin).
- `PUT /api/batches/:id` — Update batch details (Admin).
- `DELETE /api/batches/:id` — Delete batch (Admin).

### Admin Operations
- `POST /api/admin/auth/login` — Administrator authentication.
- `GET /api/admin/dashboard` — Organization summary metrics and inactive warnings.
- `GET /api/admin/students` — Paginated student table with batch and activity filters (`active_today`, `active_week`, `inactive`).
- `GET /api/admin/students/:id?range=30` — Individual student deep analytics.
- `POST /api/admin/students/:id/sync` — Trigger sync on behalf of student.
- `POST /api/admin/sync-all` — Bulk sync job across all enrolled students.
- `GET /api/admin/admins` — Multi-admin team listing (Super Admin).
- `POST /api/admin/admins` — Create Admin / Moderator account (Super Admin).
- `DELETE /api/admin/admins/:id` — Remove admin account (Super Admin).
- `GET /api/admin/reports/weekly` — Weekly student matrix grid (Mon–Sun).
- `GET /api/admin/reports/monthly` — Monthly performance analytics.
- `POST /api/notifications/send` — Broadcast announcements to all or specific batch.

---

## 🔒 Security & Architecture Design

1. **Zero Credential Requirement**: The system never asks for or stores third-party LeetCode or GFG passwords. It queries only public profiles.
2. **Modular Adapters**: Platform services are structured in `backend/services/leetcodeService.js` and `backend/services/gfgService.js`. If third-party APIs update, only the isolated service file requires modification.
3. **Role-Based Access Control**: Strict segregation between Student, Moderator, Admin, and Super Admin privileges.
4. **Session Safety**: Short-lived sessions use HttpOnly, SameSite cookies; logout and password changes invalidate existing sessions.
5. **Conservative Daily Counts**: Daily changes are counted only from same-day snapshots, avoiding unsupported attribution of multi-day total changes to a single date.
=======
# DsaArena
>>>>>>> 774de71f07acf2ad65c709d0f2545d8fa6bcfdec
