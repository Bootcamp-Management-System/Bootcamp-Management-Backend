# Internal Bootcamp Flow

## Bootcamp Types

Bootcamps now have `bootcampType`:

- `external`: default public/recruitment bootcamp
- `internal`: member-only bootcamp

External bootcamps keep the normal application template and recruitment pipeline behavior.

Internal bootcamps are hidden from:

- landing page public bootcamp list
- student application/explore bootcamp list
- direct application submission

## Member Access

Verified members can fetch internal bootcamps for their member divisions through:

```http
GET /api/v1/bootcamps/internal/member?division=:divisionId
```

Members enroll directly without an application through:

```http
POST /api/v1/enrollments/internal
```

Body:

```json
{ "bootcampId": "..." }
```

The backend verifies:

- the bootcamp is `internal`
- the bootcamp is published
- the user has `isMember: true` for the bootcamp division

The enrollment is created active immediately, without OTP.

## Dashboard Scoping

Student bootcamp dashboards request sessions, tasks, attendance, and feedback for the selected bootcamp only.

The sessions API now keeps the requested `bootcamp` filter for students after verifying the student has an active enrollment in that bootcamp. If the student is not enrolled, the API returns an empty list instead of falling back to every bootcamp the student has joined.

This prevents sessions, attendance, resources, and feedback from one bootcamp appearing under another bootcamp dashboard.

The frontend member portal label is normalized to the backend `student` view role, so instructors or admins using the member/student portal receive the same scoped bootcamp dashboard data.
