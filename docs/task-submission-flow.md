# Task Submission Flow

## Task Management

Instructors/admins can create tasks with:

- title and detailed description
- optional project details link, such as Notion or Google Docs
- deadline with date and time
- session, bootcamp, and division ownership

Tasks created for a bootcamp appear under the student's **My Tasks** area for students actively enrolled in that bootcamp.

## Student Submissions

Students can submit:

- submission title
- submission description
- uploaded file
- GitHub link
- Google Drive file or folder link
- project/demo link
- optional comment

The backend accepts `multipart/form-data` on:

- `POST /api/v1/submissions/:taskId`
- `PATCH /api/v1/submissions/:id`

Uploaded files are stored under `/uploads/submissions`.

## Resubmission And Version Tracking

Each student still has one current submission per task. When a student resubmits, the previous submission data is copied into `versions`, `version` is incremented, and the latest submission becomes pending again.

Returned submissions can be resubmitted even after the original deadline, so instructors can request fixes without losing the submission history.

## Instructor Grading

Instructors/admins review with:

- `status`: `graded` or `returned`
- `gradeLetter`: `A`, `B`, `C`, or `D`
- `feedback`: written feedback

Endpoint:

- `PATCH /api/v1/submissions/:id/review`

The backend stores the grade letter and a numeric equivalent for reporting:

- A = 100
- B = 85
- C = 70
- D = 55

Instructors can also review submissions from a session workspace through the **Task Submissions** tab next to Feedback. That view shows student name, task title, submission title/description, Google Drive link, GitHub link, uploaded file, and project link.

Student task pages show session grades by averaging the A-D grade points for graded tasks in that session.
