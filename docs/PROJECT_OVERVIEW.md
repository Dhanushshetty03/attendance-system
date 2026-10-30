# Smart Attendance Management System — Project Overview

## 1. Executive Summary

The **Smart Attendance Management System** is an enterprise-grade academic management web platform inspired by the workflows and operational rigor of the Logisys college student information system.

Designed for higher education institutions, engineering colleges, and universities, this portal reimagines the classic Logisys attendance tracking workflow with a modern, responsive, high-performance user interface, real-time analytics, automated attendance shortage warnings, proactive calculation engines, and cryptographic auditability.

---

## 2. Problem Statement & Motivation

Traditional university attendance portals often suffer from:
- Cluttered, outdated legacy user interfaces that fail on mobile devices.
- Lack of proactive analytics for students to understand their risk of examination detention.
- Manual and error-prone calculation of how many future classes students must attend to reach mandatory attendance thresholds (e.g. 75%).
- Clunky attendance marking workflows for faculty that risk duplicate entries.
- Missing or weak audit trails when records are modified retroactively.

The Logisys-Inspired Smart Attendance System solves these problems by providing:
1. **Modern, accessible, and responsive user experience** (Tailwind CSS, clean dark/light mode, executive aesthetics).
2. **Formula-driven Attendance Calculator** with bunk-buffer allowance and what-if simulation.
3. **One-Click Faculty Attendance Workspace** with auto-locking, duplicate submission prevention, and 72-hour authorized edit windows.
4. **Administrative Adjudication Workflow** for handling student attendance grievances, medical certificates, and official duty (OD) authorizations.
5. **Role-Based Security** with JWT authentication, role guards (`STUDENT`, `FACULTY`, `ADMIN`), and immutable security audit logs.

---

## 3. Core Modules & Capabilities

### 3.1 Student Portal
- **Attendance Percentage KPI Cards**: Immediate visual indicator of overall attendance and shortage status.
- **Subject-Wise Attendance Table**: Conducted, Attended, Missed, Attendance %, Status badge, Instructor name, and target advice.
- **Attendance Trends Visualizer**: Responsive Recharts line chart tracking attendance rate evolution over the semester.
- **Course Comparison Analytics**: Bar chart comparing attendance across all enrolled subjects against the 75% threshold line.
- **Target Attendance Calculator**: Uses the university formula $x = \max(0, \lceil \frac{r \cdot t - a}{1 - r} \rceil)$ to calculate the exact consecutive classes needed to reach 75%, 80%, 85%, or 90%, plus safe bunk allowances.
- **Weekly Schedule & Timetable**: Day-wise timetable with time slots, course names, instructors, and room numbers.
- **Grievance & Correction Requests**: Submit rectification requests for missed classes with supporting document URLs and tracks status.
- **Export Statements**: Direct export to CSV and printable formal PDF attendance statements.

### 3.2 Faculty Portal
- **Faculty Teaching Workspace**: Overview of assigned courses, today's schedule, and completion metrics.
- **One-Click Attendance Marking**:
  - Live counts: Enrolled, Present, Absent, Leave, and session attendance percentage.
  - Quick action buttons ("Mark All Present", "Clear to Absent").
  - Searchable student roster with interactive toggle chips (`P`, `A`, `L`).
  - Strict duplicate session prevention for identical subject, section, date, and slot.
  - Immediate lock upon submission.
- **Conducted Sessions History**: Review past class sessions with attendance breakdown and topic logs.
- **Authorized Edit Window**: Allows authorized attendance adjustments within 72 hours, mandating an audit explanation.
- **Course Analytics & Shortage Detection**: Identify at-risk students before final examination eligibility lists are drawn.

### 3.3 Administrator Portal
- **Executive Campus Dashboard**: Campus average attendance, total students, total faculty, and branch-level comparisons.
- **Department-Level Attendance Analytics**: Real-time cross-department comparison chart (CSE, ISE, ECE, ME).
- **Student Enrollment & Records**: Add and manage student registrations, auto-enroll in semester curricula, and inspect individual PDF statements.
- **Faculty Directory**: Manage faculty members, employee IDs, and course assignments.
- **Correction Request Adjudication**: Review student claims, inspect proof links, and approve or reject with official remarks.
- **Security Audit Logs**: Track all system activities (logins, marks submitted, records edited, setting updates) with IP logging.
- **Portal Configuration**: Modify attendance threshold percentages (75% default, 65% critical), college name, and edit window parameters.
