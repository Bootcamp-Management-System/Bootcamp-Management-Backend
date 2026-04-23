# Bootcamp Management API Reference

This file documents the current API surface based on the live routes in `src/routes/` and controllers in `src/controllers/`.

Base URL: `http://localhost:5000/api/v1`

Common response shape:
- Success responses usually return `{ success: true, ... }`
- Errors usually return `{ message: "..." }` or `{ error: "...", message: "..." }`

## Landing Page (Public)

### GET `/bootcamps/public`
- Access: Public
- Description: Fetches all published bootcamps for the landing page.
- Response: `200 OK` with `{ success: true, data: bootcamps[] }`

### GET `/bootcamps/public/:id`
- Access: Public
- Description: Fetches details of a specific bootcamp for the landing page.
- Response: `200 OK` with `{ success: true, data: bootcamp }`

### GET `/divisions/public`
- Access: Public
- Description: Fetches list of divisions for the landing page.
- Response: `200 OK` with `{ success: true, count, data: divisions[] }`

## Authentication

### POST `/auth/signup`
- Access: Public
- Description: Open signup for new students.
- Body:
  ```json
  {
    "email": "student@example.com",
    "password": "password123",
    "name": "Jane Doe"
  }
  ```

### POST `/auth/login`
- Access: Public
- Body (`req.body`):
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- Response:
  - `200 OK` with `{ success: true, token, refreshToken, user }`
  - Note: `user` object includes `memberships`, `isMember`, and `isInstructor` helper flags.

### POST `/auth/verify-otp`
- Access: Public
- Body (`req.body`):
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "newSecurePassword123"
  }
  ```

## Bootcamps (Protected)

### POST `/bootcamps`
- Access: Super Admin / Admin
- Body: `{ name, division, description, startDate, endDate, status, isPublished }`

### GET `/bootcamps`
- Access: Authenticated

## Users & Memberships

### POST `/users/import-members`
- Access: Super Admin
- Body: `{ members: [{ email, name, divisions: [id] }] }`

### GET `/users/pool`
- Access: Super Admin / Admin
- Description: Search globally for verified members (`is_Member = true`).

### PATCH `/users/:id/promote`
- Access: Super Admin / Admin
- Description: Promote a Member to Instructor (Admin) or a Member to Admin (Super Admin).

## Membership Decisions

### GET `/membership/candidates/:bootcampId`
- Access: Admin
- Description: Get students who applied for membership at the end of a bootcamp.

### PATCH `/membership/decision`
- Access: Admin
- Body: `{ studentId, bootcampId, decision: "MEMBER" | "REJECT" }`

## Recruitment & Applications

### POST `/recruitment/apply`
- Access: Authenticated (Student)
- Body: `{ bootcampId, phase1Answers: [] }`

### GET `/recruitment/template/:bootcampId`
- Access: Authenticated

... (See legacy sections for Tasks, Submissions, Resources, and Sessions)