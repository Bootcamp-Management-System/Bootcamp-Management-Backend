# Session Feedback Flow

## Behavior

1. An instructor ends a session from the instructor session workspace.
2. The backend marks the session as `completed`, sets `completedAt`, and notifies enrolled students.
3. Students can submit one feedback entry for that completed session.
4. The assigned instructor can view anonymous feedback and rating stats under the session's Feedback tab.

## API

- `PATCH /api/v1/sessions/:id`
  - Instructor payload: `{ "status": "completed", "notifyStudents": true }`
  - Completing a session automatically opens feedback for enrolled students.

- `POST /api/v1/feedback`
  - Student/member payload: `{ "sessionId": "...", "rating": 1-5, "comment": "optional" }`
  - Staff users can also submit when the frontend sends `X-View-Role: student` or `X-View-Role: member`.
  - Requires the session to be completed.
  - Requires the student to be actively enrolled in the session bootcamp.
  - Enforces one feedback record per student per session.

- `GET /api/v1/feedback?session=:sessionId`
  - Students receive only their own feedback for the session.
  - Instructors receive anonymous feedback for sessions assigned to them.

- `GET /api/v1/feedback/stats/:sessionId`
  - Returns `{ "averageRating": number, "totalFeedbacks": number }` for authorized staff.

## Frontend Notes

`feedbackService` normalizes backend responses so pages receive:

- `getFeedback(...)` as an array
- `getSessionStats(...)` as a stats object

This keeps the student session page and instructor Feedback tab aligned with the backend response envelope.
