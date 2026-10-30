# REST API Documentation & Endpoints Specification

## 1. Overview & Base URL

All endpoints are served under `/api` and expect/produce `application/json`.

```
Base URL: http://localhost:5000/api
Authentication Header: Authorization: Bearer <JWT_TOKEN>
```

---

## 2. Authentication Endpoints

### 2.1 User Login
- **Endpoint**: `POST /api/auth/login`
- **Rate Limit**: 30 attempts per 15-minute window per IP.
- **Request Body**:
```json
{
  "email": "student.rahul@logisys.edu",
  "password": "Student@123"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u-uuid-1",
    "email": "student.rahul@logisys.edu",
    "name": "Rahul Verma",
    "role": "STUDENT",
    "studentProfile": {
      "usn": "1MS21CS089",
      "semester": 5,
      "section": "5A"
    }
  }
}
```

### 2.2 Get Current Authenticated Profile
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**: User object with linked profile and `unreadNotificationsCount`.

### 2.3 Update Profile Information
- **Endpoint**: `PUT /api/auth/profile`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
```json
{
  "contactNo": "+91 97410 11001",
  "guardianName": "Ramesh Verma",
  "guardianContact": "+91 97410 00000"
}
```

---

## 3. Student Portal Endpoints

### 3.1 Student Dashboard Summary
- **Endpoint**: `GET /api/student/dashboard`
- **Authorization**: `STUDENT`, `ADMIN`
- **Response Data**:
  - `student`: USN, department, semester, section.
  - `threshold`: Configured threshold (e.g., 75%).
  - `summary`: Overall percentage, total conducted, attended, missed, and shortage warnings.
  - `subjectWise`: Array of subjects with conducted, attended, percentage, faculty name, and target advice.
  - `attendanceTrend`: Chronological percentage progression data for line charts.
  - `todayClasses`: Schedule for today with room numbers and instructors.
  - `recentActivity`: Last 7 marked attendance sessions.

### 3.2 Detailed Attendance History
- **Endpoint**: `GET /api/student/attendance`
- **Query Parameters**:
  - `subjectId` (optional): Filter by course UUID or `ALL`
  - `status` (optional): `PRESENT`, `ABSENT`, `LEAVE`, or `ALL`
  - `startDate`, `endDate` (optional): ISO date range

### 3.3 Target Attendance Calculator
- **Endpoint**: `GET /api/student/calculator?target=75`
- **Response**:
```json
{
  "success": true,
  "targetPercentage": 75,
  "overall": {
    "classesNeeded": 0,
    "classesCanMiss": 2,
    "currentPercentage": 80.0,
    "targetPercentage": 75.0,
    "status": "ON_TRACK",
    "message": "You can safely miss up to 2 classes while maintaining at least 75%."
  },
  "subjectWise": [...],
  "formulaExplanation": {
    "formula": "x = max(0, ceil((r * t - a) / (1 - r)))",
    "bunkBufferFormula": "m = floor((a - r * t) / r)"
  }
}
```

### 3.4 Submit Attendance Correction Request
- **Endpoint**: `POST /api/student/corrections`
- **Request Body**:
```json
{
  "sessionId": "session-uuid-1",
  "requestedStatus": "PRESENT",
  "reason": "Participated in University Hackathon representing the department with OD approval.",
  "proofDocUrl": "https://example.com/od_certificate.pdf"
}
```

---

## 4. Faculty Portal Endpoints

### 4.1 Faculty Workspace Overview
- **Endpoint**: `GET /api/faculty/dashboard`
- **Authorization**: `FACULTY`, `ADMIN`
- **Returns**: Assigned courses, enrolled student counts, today's teaching schedule, and recent sessions.

### 4.2 Enrolled Students Roster
- **Endpoint**: `GET /api/faculty/students?subjectId=<UUID>&sectionId=<UUID>`
- **Returns**: Array of enrolled students with roll number, USN, name, and cumulative attendance %.

### 4.3 Submit & Lock Attendance
- **Endpoint**: `POST /api/faculty/attendance`
- **Authorization**: `FACULTY`, `ADMIN`
- **Duplicate Prevention**: If session already exists for same `(subjectId, sectionId, date, timeSlot)`, returns `409 Conflict`.
- **Request Body**:
```json
{
  "subjectId": "sub-uuid-1",
  "sectionId": "sec-uuid-1",
  "date": "2026-10-30",
  "timeSlot": "09:00 - 10:00",
  "topicCovered": "B-Tree Insertion & Deletion Algorithms",
  "sessionType": "REGULAR",
  "records": [
    { "studentId": "std-uuid-1", "status": "PRESENT" },
    { "studentId": "std-uuid-2", "status": "ABSENT" }
  ]
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Attendance marked, validated, and locked successfully.",
  "summary": {
    "totalEvaluated": 20,
    "presentCount": 18,
    "absentCount": 2,
    "leaveCount": 0,
    "attendancePercentage": 90.0
  }
}
```

### 4.4 Retroactive Attendance Revision
- **Endpoint**: `PUT /api/faculty/sessions/:sessionId`
- **Authorization**: `FACULTY` (within 72 hours), `ADMIN` (unrestricted)
- **Request Body**:
```json
{
  "records": [
    { "recordId": "rec-uuid-1", "status": "PRESENT", "remarks": "Adjusted with physical sign-in sheet" }
  ],
  "auditReason": "Discrepancy resolved after reviewing physical laboratory roster."
}
```

---

## 5. Administrator Portal Endpoints

### 5.1 Campus Overview
- **Endpoint**: `GET /api/admin/dashboard`
- **Returns**: Campus metrics, department comparison analytics, pending correction queue, and security audit log snippets.

### 5.2 Enroll Student
- **Endpoint**: `POST /api/admin/students`
- **Request Body**: Name, email, USN, departmentId, semester, section, roll number. Auto-enrolls student in active semester subjects.

### 5.3 Review Correction Request
- **Endpoint**: `PUT /api/admin/corrections/:id/review`
- **Request Body**:
```json
{
  "status": "APPROVED",
  "reviewRemarks": "Verified official medical certificate with Student Health Center."
}
```

### 5.4 Update System Settings
- **Endpoint**: `PUT /api/admin/settings`
- **Request Body**: Key-value pairs for `min_attendance_threshold`, `critical_attendance_threshold`, `institution_name`, `attendance_edit_window_hours`.
