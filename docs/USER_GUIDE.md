# Logisys Smart Attendance System — Comprehensive User Guide

## 1. Quick Start & Instant Demo Evaluation

The portal provides pre-seeded accounts for every user role with realistic academic data:

| Role | Demo Account | Credentials | Highlights |
|---|---|---|---|
| **Student (Good)** | Rahul Verma | `student.rahul@logisys.edu` / `Student@123` | 82.0% attendance, good academic standing |
| **Student (Shortage)** | Priya Nair | `student.priya@logisys.edu` / `Student@123` | 68.57% attendance in DBMS, triggers shortage warning & calculator demo |
| **Faculty (HOD)** | Dr. Rajesh Sharma | `faculty.sharma@logisys.edu` / `Faculty@123` | Teaches DBMS and Web Lab for Section 5A |
| **Faculty** | Prof. Anita Patel | `faculty.patel@logisys.edu` / `Faculty@123` | Teaches DSA and Networks for Section 5A |
| **Administrator** | Chief Registrar | `admin@logisys.edu` / `Admin@123` | Full administrative control, correction approvals, campus analytics |

> **Pro Tip**: Use the **"Demo Switch"** bar located in the top header to instantly switch roles with one click without manually typing credentials!

---

## 2. Student User Guide

### 2.1 Viewing Dashboard & Attendance Alerts
1. Log in using student credentials.
2. The **Overall Attendance Card** highlights your cumulative percentage across all enrolled subjects.
3. If your overall percentage or any individual course falls below the mandatory 75% threshold, a prominent **Attendance Shortage Alert** banner appears.
4. Review the **Attendance Trajectory Line Chart** to track whether your attendance is improving or declining over the semester.
5. In the **Subject-wise Table**, review your attended vs conducted classes for each course.

### 2.2 Using the Attendance Target Calculator
1. Navigate to **Attendance Calculator** from the sidebar or click "Open Calculator" from the warning banner.
2. Select your desired Target Percentage (e.g., 75%, 80%, 85%, or 90%).
3. The system calculates:
   - **Consecutive Classes Needed**: Exactly how many upcoming classes you must attend without missing a single one ($x = \max(0, \lceil \frac{r \cdot t - a}{1 - r} \rceil)$).
   - **Safe Miss Buffer**: If your attendance is already above the target, how many classes you can safely skip ($m = \lfloor \frac{a - r \cdot t}{r} \rfloor$) without falling below the target.
4. Use the **Interactive "What-If" Simulator** sliders to experiment with hypothetical future classes attended or missed.

### 2.3 Downloading Attendance Statements
1. On the Student Dashboard, click **Official PDF Statement**.
2. A formal collegiate attendance certificate with institutional header, student USN, course breakdown, eligibility stamp, and signature lines is downloaded instantly.
3. Click **CSV** to download raw spreadsheet records.

### 2.4 Raising an Attendance Correction Request
1. Navigate to **Attendance History**.
2. Locate any session where your status is marked as **ABSENT**.
3. Click **Request Correction** on the right.
4. Enter your justification (e.g., Medical leave, official duty, or collegiate sports/hackathon participation).
5. Optionally paste a link to your medical certificate or OD approval letter.
6. Click **Submit to Administrator**. You can track the approval status on the **Correction Requests** page.

---

## 3. Faculty User Guide

### 3.1 Marking Class Attendance
1. Log in as a Faculty member.
2. Under **Today's Teaching Schedule**, locate your upcoming class session and click **Mark This Attendance** (or navigate to **Mark Attendance** from the sidebar).
3. Confirm the Subject, Section, Session Date, Time Slot, and Session Type (Theory or Lab).
4. Enter the topic covered (e.g. *"Graph Traversals — BFS & DFS implementation"*).
5. In the **Student Roster**:
   - Use **Mark All Present** to quickly set everyone present.
   - For absent students, click the **Absent (A)** button.
   - For students with authorized on-duty leave, click **Leave (L)**.
   - Watch the **Live Stats Header Bar** update in real-time (Present count, Absent count, Attendance rate %).
6. Click **Lock & Submit Attendance**.
7. Confirm the submission summary in the modal dialog.
8. The session is saved to the database, locked against duplicate submission, and an immutable audit entry is recorded.

### 3.2 Modifying Past Attendance (72-Hour Edit Window)
1. Navigate to **Sessions History**.
2. Click **Inspect / Edit** on any recent session.
3. If the session is within the authorized 72-hour window, click **Edit Attendance**.
4. Adjust the student attendance statuses.
5. Provide a mandatory **Audit Reason** (e.g., *"Corrected mark entry verified with student physical signature roster"*).
6. Click **Save & Record Audit**.

---

## 4. Administrator User Guide

### 4.1 Campus Attendance Governance
1. Log in as Administrator (`admin@logisys.edu`).
2. The **Executive Dashboard** presents:
   - Campus average attendance percentage.
   - Total students at risk of attendance detention (< 75%).
   - Department-level comparison bar chart (CSE, ISE, ECE, ME).
   - Pending student correction requests awaiting adjudication.

### 4.2 Enrolling New Students
1. Navigate to **Students**.
2. Click **Enroll New Student**.
3. Fill in student Name, USN, Email, Department, and Semester.
4. Click **Confirm Enrollment**.
5. The student account is created with default credentials (`Student@123`) and automatically enrolled in the active curriculum courses for that semester.

### 4.3 Adjudicating Correction Requests
1. Navigate to **Correction Requests** (or click the alert banner).
2. Inspect the student's claimed justification and open any attached proof document link.
3. Click **Adjudicate**.
4. Choose **Approve & Update Roster** or **Reject Request**.
5. Enter required review remarks (e.g., *"Medical certificate verified with Health Center"*).
6. Click **Confirm Decision**. If approved, the attendance record is updated in the database, and an in-app notification is sent to the student.

### 4.4 Configuring Thresholds & Broadcasting Notices
1. Navigate to **Portal Settings**.
2. Update the **Mandatory Minimum Threshold** (e.g. 75%) or **Critical Shortage Threshold** (e.g. 65%).
3. Use the **Broadcast Notice** tool to transmit high-priority announcements to all students or faculty members.
