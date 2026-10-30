# Smart Attendance Management System — Logisys-Inspired Clone

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-blue.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v3-38B2AC.svg)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-27%20Passed-brightgreen.svg)](docs/TESTING.md)

An enterprise-quality college student and faculty attendance management portal inspired by the functionality and administrative workflows of the **Logisys college student information system**.

Rebuilt from the ground up with modern web technologies, executive UI design, interactive analytics, target projection formulas, and audit integrity.

---

## 🌟 Highlights & Core Features

### 🎓 Student Experience
- **Real-Time Attendance KPIs**: Track overall percentage, total conducted, attended, and missed classes with clean visual badges.
- **Low Attendance Warning Banner**: Instant automated alert triggered when any subject falls below the 75% threshold.
- **Attendance Target Calculator**: Uses the mathematical formula $x = \max(0, \lceil \frac{r \cdot t - a}{1 - r} \rceil)$ to calculate exact consecutive classes needed to attain 75%, 80%, 85%, or 90%, plus safe bunk allowances ($m = \lfloor \frac{a - r \cdot t}{r} \rfloor$).
- **"What-If" Scenario Simulator**: Interactive sliders allow students to test hypothetical attendance outcomes before making decisions.
- **Visual Analytics**: Interactive Recharts progression line charts and course comparison bar charts.
- **Semester Class Timetable**: Weekly view of lecture timings, lab slots, room allocations, and faculty names.
- **Grievance & Correction Requests**: Submit medical leave certificates and On-Duty (OD) reconciliation requests directly to administrators.
- **Official Statement Downloads**: Export filtered attendance records as CSV and download formal, formatted PDF attendance statements.

### 👨‍🏫 Faculty Experience
- **Teaching Workspace**: Today's lecture schedule with instant 1-click attendance marking.
- **Interactive Marking Roster**: Searchable student roster with toggle buttons (`Present`, `Absent`, `Leave`), "Mark All Present" shortcut, and live attendance percentage counters.
- **Duplicate Prevention**: Guaranteed duplicate session prevention for identical course, section, date, and hour slot.
- **Auto-Locking & 72-Hour Edit Window**: Sessions are locked immediately upon submission with an authorized 72-hour window for audited corrections.
- **Course-Level Analytics**: Identify students at risk of attendance detention and export class attendance sheets.

### 🏛️ Administrator Experience
- **Campus Executive Dashboard**: Department-wise attendance comparison charts (CSE, ISE, ECE, ME) and detention risk indicators.
- **Student Enrollment**: Register students, assign university seat numbers (USN), and auto-enroll them in active semester curricula.
- **Faculty Directory**: Manage faculty appointments, employee IDs, and course allocations.
- **Adjudication Workspace**: Review student correction claims, inspect attached certificate links, and approve or reject with review remarks.
- **Immutable Security Audit Log**: Immutable log of logins, attendance submissions, modifications, and administrative decisions with IP address tracking.
- **Threshold Configuration**: Customize university attendance policies (minimum threshold, critical threshold, college name, edit window hours).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 with Vite |
| **Styling** | Vanilla CSS & Tailwind CSS (Custom navy/white palette, responsive layout) |
| **Components** | Custom design system inspired by shadcn/ui (Accessible modals, cards, badges) |
| **Icons** | Lucide React |
| **Data Visualization** | Recharts (Responsive Line, Bar, and Reference Charts) |
| **Backend** | Node.js & Express.js |
| **Database ORM** | Prisma ORM with SQLite (Local zero-config dev) & PostgreSQL support |
| **Authentication** | Secure stateless JWT with bcrypt password hashing and RBAC middleware |
| **Validation** | Zod schema validation on all API requests |
| **Document Export** | jsPDF & jspdf-autotable (PDF statements) and RFC4180 CSV export |
| **Testing** | Vitest test runner (27 automated tests passing) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
cd server && npm install && cd ..
```

### 2. Database Setup & Seeding
Initialize the SQLite database with Prisma and seed realistic semester data:
```bash
cd server
npx prisma db push
node prisma/seed.js
cd ..
```
*The seed script populates 20 enrolled students, 3 faculty members, 5 semester courses, 160+ class sessions, and 3,200+ attendance records spanning 45 historical days.*

### 3. Running Locally
Run both the backend API server (`http://localhost:5000`) and the Vite frontend (`http://localhost:5173`) concurrently with a single command:
```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Pre-Seeded Demo Accounts

You can log in manually or use the **"Demo Switch"** bar in the top navigation header for instant 1-click evaluation:

| User | Email | Password | Role | Features Demonstrated |
| Name | Email | Password | Role | Department / Key Features to Test |
|---|---|---|---|---|
| **Rahul Verma** | `student.rahul@logisys.edu` | `Student@123` | `STUDENT` | CSE (5A) · 83.3% Good attendance, timetable, PDF statement |
| **Priya Nair** | `student.priya@logisys.edu` | `Student@123` | `STUDENT` | CSE (5A) · 65.78% Low attendance shortage warning, bunk calculator |
| **Shreya Kulkarni** | `shreya.k@logisys.edu` | `Student@123` | `STUDENT` | ISE (5A) · 92.4% High attendance, cloud computing & security courses |
| **Aarav Singhal** | `aarav.s@logisys.edu` | `Student@123` | `STUDENT` | AIML (5A) · 94.0% AI & Deep Learning, PyTorch Lab |
| **Dr. Rajesh Sharma** | `faculty.sharma@logisys.edu` | `Faculty@123` | `FACULTY` | HOD CSE · Teaches DBMS & Web Lab, attendance marking & session deletion |
| **Dr. Kavitha Raman** | `faculty.raman@logisys.edu` | `Faculty@123` | `FACULTY` | Head ISE · Teaches Cloud Computing & DevOps Lab |
| **Dr. Sunita Murthy** | `faculty.murthy@logisys.edu` | `Faculty@123` | `FACULTY` | Lead AIML · Teaches Deep Neural Nets, NLP & LLMs |
| **Chief Registrar** | `admin@logisys.edu` | `Admin@123` | `ADMIN` | Campus-wide dashboard, 4 departments analytics, audit logs & correction reviews |

---

## 🧪 Automated Testing

Execute the Vitest automated test suite:
```bash
npm test
```

### Test Coverage Highlights:
- **Calculator Formulas**: Normal percentages, edge cases, zero classes conducted, 100% target limits, and bunk buffer calculations.
- **Zod Validation**: Login credentials, UUID integrity, date formats, and correction request length checks.
- **JWT Security**: Token signing, payload claim verification, and rejection of malformed or tampered tokens.
- **Duplicate Prevention**: Rejection of duplicate sessions for the same subject, section, date, and hour slot.
- **Enrollment Validation**: Enforcing active student course enrollment before attendance marking.

---

## 📚 Documentation Directory

Detailed architectural and operational documentation is available in the `docs/` folder:

- [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — Scope, problem statement, and module breakdowns.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System architecture, authentication sequence, and submission flow diagrams.
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — Entity Relationship Diagram (ERD), tables, constraints, and indexes.
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — REST endpoints, request/response JSON payloads, and error codes.
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) — Step-by-step user manual for Students, Faculty, and Administrators.
- [`docs/SECURITY.md`](docs/SECURITY.md) — Authentication, authorization, rate limiting, and audit logging specifications.
- [`docs/TESTING.md`](docs/TESTING.md) — Automated test suite specifications and execution instructions.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Production checklist, PostgreSQL transition, Docker/PM2, and Nginx reverse proxy.
- [`.env.example`](.env.example) — Documented configuration parameters.

---

## 🛡️ License

This project is licensed under the MIT License — designed for educational and academic management portal environments.
