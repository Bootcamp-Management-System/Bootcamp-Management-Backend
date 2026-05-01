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
