# 🚀 BMS Postman Testing Guide

This guide provides a step-by-step flow to test the entire Bootcamp Management System.

**Base URL:** `http://localhost:5000/api/v1`

---

## 🛠️ Step 0: Setup
In Postman, set a variable `{{token}}`. 
For every protected request, go to the **Authorization** tab, select **Bearer Token**, and use `{{token}}`.

---

## 🏃 Scenario 1: The Student "Onboarding" Journey

### 1. Create Account
- **POST** `/auth/signup`
- **Body:** `{ "email": "test_student@gmail.com", "password": "Password123!", "name": "Test Student" }`
- *Check your email for the OTP code.*

### 2. Verify Email
- **POST** `/auth/verify-otp`
- **Body:** `{ "email": "test_student@gmail.com", "otp": "CODE_FROM_EMAIL" }`

### 3. Login
- **POST** `/auth/login`
- **Body:** `{ "email": "test_student@gmail.com", "password": "Password123!" }`
- **Action:** Copy the `token` from response and update your Postman `{{token}}`.

### 4. Apply for a Bootcamp
- **POST** `/recruitment/apply`
- **Body:** 
  ```json
  { 
    "bootcampId": "PASTE_BOOTCAMP_ID_HERE", 
    "phase1Answers": { "experience": "Beginner", "interest": "Web Dev" } 
  }
  ```

---

## 👑 Scenario 2: The Admin "Management" Journey

### 1. Login as Super Admin
- **POST** `/auth/login` (Use your super-admin credentials)
- **Action:** Update your Postman `{{token}}`.

### 2. Create a Division
- **POST** `/divisions`
- **Body:** `{ "name": "Software Engineering", "description": "Fullstack development school" }`

### 3. Create a Bootcamp
- **POST** `/bootcamps`
- **Body:** 
  ```json
  { 
    "name": "Summer Coding 2026", 
    "division": "PASTE_DIVISION_ID", 
    "isPublished": true,
    "startDate": "2026-06-01" 
  }
  ```

### 4. Accept the Student
- **PATCH** `/recruitment/decide/PASTE_APPLICATION_ID`
- **Body:** `{ "decision": "ACCEPT", "note": "Welcome!" }`
- *Note: This triggers an Enrollment OTP to the student's email.*

---

## 🎓 Scenario 3: The Classroom & Attendance Flow

### 1. Student Activates Enrollment
- **POST** `/enrollments/activate` (Use Student Token)
- **Body:** `{ "otp": "CODE_FROM_ACCEPTANCE_EMAIL" }`

### 2. Admin Creates Session
- **POST** `/sessions` (Use Admin Token)
- **Body:** 
  ```json
  {
    "title": "Introduction to React",
    "bootcamp": "BOOTCAMP_ID",
    "instructor": "YOUR_USER_ID",
    "startTime": "2026-06-01T09:00:00Z",
    "endTime": "2026-06-01T11:00:00Z"
  }
  ```

### 3. Instructor Generates QR
- **GET** `/attendance/qr-token/PASTE_SESSION_ID` (Use Instructor/Admin Token)
- **Action:** Copy the returned `token`.

### 4. Student Scans QR
- **POST** `/attendance/scan` (Use Student Token)
- **Body:** `{ "token": "PASTE_QR_TOKEN_HERE" }`
- **Condition:** This must be done within 20 seconds!

---

## 🌟 Scenario 4: The Landing Page (Public)
*No Authorization required.*
- **GET** `/bootcamps/public`
- **GET** `/feedback/public`
- **GET** `/success-stories/public`
