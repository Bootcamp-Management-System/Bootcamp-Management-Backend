# Bootcamp Management API Reference

Base URL: `http://localhost:5000/api/v1`

---

## 🔑 1. Authentication
### POST `/auth/signup`
- **Body:**
  ```json
  {
    "email": "student@example.com",
    "password": "Password123!",
    "name": "Jane Doe"
  }
  ```

### POST `/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response:** `{ "token": "...", "refreshToken": "...", "user": { "role": "student", "isMember": false } }`

### POST `/auth/forgot-password`
- **Body:** `{ "email": "user@example.com" }`

### POST `/auth/reset-password`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewSecurePassword!"
  }
  ```

---

## 🚀 2. Recruitment & Enrollment
### POST `/recruitment/apply`
- **Body:**
  ```json
  {
    "bootcampId": "ID_HERE",
    "phase1Answers": {
      "why_join": "I love coding",
      "experience": "Beginner"
    }
  }
  ```

### PATCH `/recruitment/decide/:applicationId`
- **Body:**
  ```json
  {
    "decision": "ACCEPT",
    "note": "Great technical skills shown."
  }
  ```
  *(Decisions: `PASS`, `WAIT`, `REJECT`, `ACCEPT`)*

### POST `/enrollments/activate`
- **Body:** `{ "otp": "123456" }`
- **Description:** Uses the code from the Acceptance Email to activate classroom access.

---

## 📅 3. Sessions & Attendance
### POST `/sessions`
- **Body:**
  ```json
  {
    "title": "React Hooks Deep Dive",
    "bootcamp": "BOOTCAMP_ID",
    "instructor": "USER_ID",
    "startTime": "2026-05-01T10:00:00Z",
    "endTime": "2026-05-01T12:00:00Z",
    "meetingLink": "https://zoom.us/j/..."
  }
  ```

### GET `/attendance/qr-token/:sessionId`
- **Response:** `{ "token": "EYJ..." }` (20-second validity)

### POST `/attendance/scan`
- **Body:** `{ "token": "TOKEN_FROM_QR" }`

### PATCH `/attendance/manual-override`
- **Body:**
  ```json
  {
    "studentId": "ID",
    "sessionId": "ID",
    "status": "PRESENT",
    "note": "Medical excuse"
  }
  ```

---

## 📂 4. Tasks, Submissions & Feedback
### POST `/tasks`
- **Body:**
  ```json
  {
    "title": "Build a Portfolio",
    "description": "Use HTML/CSS",
    "session": "SESSION_ID",
    "dueDate": "2026-05-10"
  }
  ```

### POST `/submissions`
- **Body:**
  ```json
  {
    "task": "TASK_ID",
    "content": "https://github.com/user/portfolio",
    "note": "Added some animations"
  }
  ```

### POST `/feedback`
- **Body:**
  ```json
  {
    "sessionId": "ID",
    "rating": 5,
    "comment": "Amazing session, very clear!"
  }
  ```

---

## 🏠 5. Landing Page (Public)
### GET `/bootcamps/public`
### GET `/divisions/public`
### GET `/feedback/public`
- **Response:** List of curated testimonials where `showOnLandingPage: true`.

### GET `/success-stories/public`
- **Response:**
  ```json
  [
    {
      "studentName": "Alex",
      "story": "Started with zero knowledge...",
      "achievement": "Dev at Microsoft",
      "bootcamp": { "name": "Fullstack Bootcamp" }
    }
  ]
  ```

---

## 🔔 6. Notifications
### GET `/notifications`
- **Response:** `{ "data": [ { "title": "New Assignment", "message": "...", "isRead": false } ] }`

### PATCH `/notifications/:id/read`
- **Description:** Mark an alert as read.
