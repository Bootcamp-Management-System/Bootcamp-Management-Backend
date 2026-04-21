# Bootcamp Management API Reference

This file documents the current API surface based on the live routes in `src/routes/` and controllers in `src/controllers/`.

Base URL: `http://localhost:5000/api/v1`

Common response shape:
- Success responses usually return `{ success: true, ... }`
- Errors usually return `{ message: "..." }` or `{ error: "...", message: "..." }`

## Authentication

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
  - Or `200 OK` with `{ message: "..." }` when OTP verification is required

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
- Response: `200 OK` with the verification result payload from the auth service

### POST `/auth/google-login`
- Access: Public
- Body (`req.body`):
  ```json
  {
    "googleToken": "google-oauth-token"
  }
  ```
- Response: `200 OK` with `{ success: true, token, refreshToken, user }`

### POST `/auth/logout`
- Access: Authenticated
- Headers: `Authorization: Bearer <token>`
- Body: none
- Response: `200 OK` with `{ success: true, message: "Logged out successfully" }`

## Users

### POST `/users/setup`
- Access: Public, one-time only when no users exist
- Body (`req.body`):
  ```json
  {
    "email": "super@admin.com",
    "password": "password123"
  }
  ```
- Response: `201 Created` with `{ success: true, message, data: { id, email, role } }`

### POST `/users`
- Access: Authenticated, `super-admin` or `admin`
- Body (`req.body`):
  ```json
  {
    "email": "new@student.com",
    "password": "password123",
    "role": "student"
  }
  ```
- Notes:
  - `password` is optional and can be generated automatically
  - When an admin creates a user, the new user automatically inherits the admin's own division
  - A `division` value is only needed when a super-admin is creating an admin account
- Response: `201 Created` with `{ success: true, message, data, tempPassword }`

### GET `/users`
- Access: Authenticated, `super-admin` or `admin`
- Body: none
- Response: `200 OK` with `{ success: true, count, data: users[] }`

### GET `/users/me`
- Access: Authenticated
- Body: none
- Response: `200 OK` with `{ success: true, data: user }`

### GET `/users/:id`
- Access: Authenticated
- Params (`req.params`):
  ```json
  {
    "id": "user_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, data: user }`

### PUT `/users/:id`
- Access: Authenticated, `super-admin` or `admin`
- Params (`req.params`):
  ```json
  {
    "id": "user_id"
  }
  ```
- Body (`req.body`):
  ```json
  {
    "email": "updated@example.com",
    "role": "student",
    "division": "division_id"
  }
  ```
- Response: `200 OK` with `{ success: true, message, data: user }`

### DELETE `/users/:id`
- Access: Authenticated, `super-admin`
- Params (`req.params`):
  ```json
  {
    "id": "user_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, message: "User deleted successfully" }`

### POST `/users/promote`
- Access: Authenticated, `super-admin` or `admin`
- Body (`req.body`):
  ```json
  {
    "newRole": "instructor",
    "divisionId": "division_id",
    "reason": "Promoted for teaching"
  }
  ```
- Response: `200 OK` with `{ success: true, message, userId, newRole, tempPassword }`

### PATCH `/users/:id/promote`
- Access: Authenticated, `super-admin` or `admin`
- Params (`req.params`):
  ```json
  {
    "id": "user_id"
  }
  ```
- Body (`req.body`): same as `POST /users/promote`
- Response: same as `POST /users/promote`

## Divisions

### POST `/divisions`
- Access: Authenticated, `super-admin`
- Body (`req.body`):
  ```json
  {
    "name": "Software Engineering",
    "description": "Fullstack Web & Mobile Development"
  }
  ```
- Response: `201 Created` with `{ success: true, data: division }`

### GET `/divisions`
- Access: Authenticated, `super-admin` or `admin`
- Body: none
- Response: `200 OK` with `{ success: true, count, data: divisions[] }`

### PATCH `/divisions/:id`
- Access: Authenticated, `super-admin`
- Params (`req.params`):
  ```json
  {
    "id": "division_id"
  }
  ```
- Body (`req.body`):
  ```json
  {
    "name": "Updated Division Name",
    "description": "Updated description"
  }
  ```
- Response: `200 OK` with `{ success: true, message, data: division }`

### DELETE `/divisions/:id`
- Access: Authenticated, `super-admin`
- Params (`req.params`):
  ```json
  {
    "id": "division_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, message: "Division deleted successfully" }`

### GET `/divisions/:divisionId/users`
- Access: Authenticated, `super-admin` or `admin`
- Params (`req.params`):
  ```json
  {
    "divisionId": "division_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, count, data: users[] }`

## Sessions

### POST `/sessions`
- Access: Authenticated, `super-admin` or `admin`
- Body (`req.body`):
  ```json
  {
    "title": "React Context API",
    "description": "Deep dive into useContext",
    "division": "division_id",
    "location": "Zoom link or room",
    "meetingLink": "https://meet.example.com/abc",
    "startTime": "2026-04-20T10:00:00.000Z",
    "endTime": "2026-04-20T12:00:00.000Z"
  }
  ```
- Notes: 
  - `instructor` ID is no longer required at creation. Admins can assign later.
- Response: `201 Created` with `{ success: true, data: session }`

### PATCH `/sessions/:id/assign-instructor`
- Access: Authenticated, `super-admin` or `admin`
- Params (`req.params`):
  ```json
  {
    "id": "session_id"
  }
  ```
- Body (`req.body`):
  ```json
  {
    "instructorId": "user_id_of_instructor"
  }
  ```
- Response: `200 OK` with `{ success: true, data: session }`

### GET `/sessions`
- Access: Authenticated
- Query (`req.query`): optional filters depending on middleware/service behavior
- Body: none
- Response: `200 OK` with `{ success: true, count, data: sessions[] }`

### PUT `/sessions/:id`
- Access: Authenticated, `super-admin` or `admin`
- Params (`req.params`):
  ```json
  {
    "id": "session_id"
  }
  ```
- Body (`req.body`): any session fields supported by the service
- Response: `200 OK` with `{ success: true, data: session }`

### DELETE `/sessions/:id`
- Access: Authenticated, `super-admin` or `admin`
- Params (`req.params`):
  ```json
  {
    "id": "session_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, message: "Session deleted successfully" }`

### GET `/sessions/:session_id/resources`
- Access: Authenticated
- Params (`req.params`):
  ```json
  {
    "session_id": "session_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, count, data: resources[] }`

## Attendance

### POST `/attendance/check-in`
- Access: Authenticated, `student`
- Body (`req.body`):
  ```json
  {
    "session": "session_id",
    "note": "Optional note"
  }
  ```
- Notes:
  - If a student checks in **> 10 minutes** after the session's `startTime`, they are automatically marked as `"Late"`. Otherwise, they are `"Present"`.
- Response: `201 Created` with `{ success: true, data: attendance }`

### POST `/attendance/mark`
- Access: Authenticated, `super-admin`, `admin`, or `instructor`
- Body (`req.body`):
  ```json
  {
    "studentId": "student_user_id",
    "sessionId": "session_id",
    "status": "Present",
    "note": "Optional note"
  }
  ```
- Notes:
  - Edits/Manual marking can **only occur within 24 hours** of the session's `endTime`. Attempts to modify attendance after this window will return a `400 Bad Request`.
- Response: `200 OK` with `{ success: true, data: attendance }`

### GET `/attendance`
- Access: Authenticated
- Query (`req.query`):
  ```json
  {
    "sessionId": "session_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, count, data: attendance[] }`

## Tasks

### POST `/tasks`
- Access: Authenticated, `super-admin`, `admin`, or `instructor`
- Body (`req.body`):
  ```json
  {
    "title": "Build a REST API",
    "description": "Create CRUD endpoints",
    "startTime": "2026-04-20T10:00:00.000Z",
    "endTime": "2026-04-25T23:59:59.000Z",
    "deadline": "2026-04-25T23:59:59.000Z",
    "division": "division_id",
    "session": "session_id"
  }
  ```
- Response: `201 Created` with `{ success: true, data: task }`

### GET `/tasks`
- Access: Authenticated
- Query (`req.query`): service-supported filters
- Body: none
- Response: `200 OK` with `{ success: true, count, data: tasks[] }`

### GET `/tasks/:id`
- Access: Authenticated
- Params (`req.params`):
  ```json
  {
    "id": "task_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, data: task }`

### PUT `/tasks/:id`
- Access: Authenticated, `super-admin`, `admin`, or `instructor`
- Params (`req.params`):
  ```json
  {
    "id": "task_id"
  }
  ```
- Body (`req.body`): task fields supported by the service
- Response: `200 OK` with `{ success: true, data: task }`

### DELETE `/tasks/:id`
- Access: Authenticated, `super-admin`, `admin`, or `instructor`
- Params (`req.params`):
  ```json
  {
    "id": "task_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, message: "Task removed" }`

## Submissions

### POST `/submissions/submit`
- Access: Authenticated, `student`
- Body (`req.body`):
  ```json
  {
    "taskId": "task_id",
    "contentUrl": "https://github.com/my-student-repo",
    "repository_url": "https://github.com/my-student-repo",
    "comment": "Optional note"
  }
  ```
- Notes:
  - `contentUrl` is the primary field
  - `repository_url` is also accepted and mapped internally
- Response: `201 Created` with `{ success: true, data: submission }`

### POST `/submissions/:taskId`
- Access: Authenticated, `student`
- Params (`req.params`):
  ```json
  {
    "taskId": "task_id"
  }
  ```
- Body (`req.body`): same as `/submissions/submit` except `taskId` comes from the URL
- Response: `201 Created` with `{ success: true, data: submission }`

### PUT `/submissions/:id`
- Access: Authenticated, `student`
- Params (`req.params`):
  ```json
  {
    "id": "submission_id"
  }
  ```
- Body (`req.body`):
  ```json
  {
    "contentUrl": "https://github.com/updated-repo",
    "comment": "Updated comment"
  }
  ```
- Response: `200 OK` with `{ success: true, data: submission }`

### PATCH `/submissions/review/:id`
- Access: Authenticated, `super-admin`, `admin`, or `instructor`
- Params (`req.params`):
  ```json
  {
    "id": "submission_id"
  }
  ```
- Body (`req.body`):
  ```json
  {
    "status": "approved",
    "feedback": "Good work",
    "grade": 95
  }
  ```
- Response: `200 OK` with `{ success: true, data: submission }`

### GET `/submissions`
- Access: Authenticated
- Query (`req.query`):
  ```json
  {
    "taskId": "task_id",
    "studentId": "student_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, count, data: submissions[] }`

## Feedback

### POST `/feedback`
- Access: Authenticated, `student`
- Body (`req.body`):
  ```json
  {
    "sessionId": "session_id",
    "rating": 5,
    "comment": "Great session"
  }
  ```
- Response: `201 Created` with `{ success: true, data: feedback }`

### GET `/feedback`
- Access: Authenticated
- Body: none
- Response: `200 OK` with `{ success: true, count, data: feedback[] }`

### PUT `/feedback/:id`
- Access: Authenticated, `student`
- Params (`req.params`):
  ```json
  {
    "id": "feedback_id"
  }
  ```
- Body (`req.body`):
  ```json
  {
    "rating": 4,
    "comment": "Updated comment"
  }
  ```
- Response: `200 OK` with `{ success: true, data: feedback }`

### GET `/feedback/stats/:sessionId`
- Access: Authenticated, `super-admin`, `admin`, or `instructor`
- Params (`req.params`):
  ```json
  {
    "sessionId": "session_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, data: { averageRating, totalFeedbacks } }`

## Resources

### POST `/resources/upload`
- Access: Authenticated, `super-admin`, `admin`, or `instructor`
- Content type: `multipart/form-data`
- Body (`form-data`):
  - `file` (File)
  - `title` (Text)
  - `description` (Text, optional)
  - `division_id` (Text)
  - `session_id` (Text, optional)
  - `visibility` (Text, optional; default is `division`)
- Response: `201 Created` with:
  ```json
  {
    "message": "Resource uploaded successfully",
    "resource_id": "resource_id",
    "file_url": "/uploads/resources/filename.ext"
  }
  ```

### GET `/resources`
- Access: Authenticated
- Body: none
- Response: `200 OK` with `{ success: true, count, groups, data: groupedResources[] }`

### GET `/resources/division/:division_id`
- Access: Authenticated
- Params (`req.params`):
  ```json
  {
    "division_id": "division_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, count, groups, data: groupedResources[] }`

### GET `/resources/:resource_id`
- Access: Authenticated
- Params (`req.params`):
  ```json
  {
    "resource_id": "resource_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, data: resource }`

### GET `/resources/:resource_id/download`
- Access: Authenticated
- Params (`req.params`):
  ```json
  {
    "resource_id": "resource_id"
  }
  ```
- Body: none
- Response: File download stream

### DELETE `/resources/:resource_id`
- Access: Authenticated, `super-admin`, `admin`, or `instructor`
- Params (`req.params`):
  ```json
  {
    "resource_id": "resource_id"
  }
  ```
- Body: none
- Response: `200 OK` with `{ success: true, message: "Resource deleted successfully" }`