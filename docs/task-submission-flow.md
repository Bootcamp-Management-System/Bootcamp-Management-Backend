# Task Submission Flow

## Task Management

Instructors/admins can create tasks with:

- title and detailed description
- optional project details link, such as Notion or Google Docs
- deadline with date and time
- max score
- session, bootcamp, and division ownership

Tasks created for a bootcamp appear under the student's **My Tasks** area for students actively enrolled in that bootcamp.

## Student Submissions

Students can submit:

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
- `grade`: numeric score
- `feedback`: written feedback

Endpoint:

- `PATCH /api/v1/submissions/:id/review`
