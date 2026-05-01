# Upload Resource Fix

## Problem

Uploading a resource through `POST /api/v1/resources/upload` returned:

```json
{ "message": "Server Error", "error": "next is not a function" }
```

## Cause

The `Resource` model used a callback-style Mongoose pre-validation hook:

```js
resourceSchema.pre('validate', function validateResourceTarget(next) {
  // ...
  next();
});
```

This backend uses Mongoose `9.4.1`, where this hook is invoked without a `next` callback in this code path. Calling `next()` therefore throws `next is not a function` during `Resource.create(...)`.

## Change

`src/models/Resource.js` now uses a no-callback pre-validation hook. The validation still marks missing `external_url` values for link resources and missing `file_url` values for uploaded file resources, but it no longer calls `next()`.

## Verification

Validated the model directly with a link resource:

```powershell
node -e "import('./src/models/Resource.js').then(async ({default: Resource}) => { const r = new Resource({ title: 'Test', resource_type: 'link', external_url: 'https://example.com', file_type: 'link', uploaded_by: '000000000000000000000000' }); await r.validate(); console.log('validated'); })"
```

Before the fix this printed `next is not a function`; after the fix it prints `validated`.
