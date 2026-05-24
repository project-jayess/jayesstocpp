# `jayess:form` Module

`jayess:form` provides small form encoding helpers.

## Surface

- `parseUrlEncoded(text)` parses `application/x-www-form-urlencoded` text into an object.
- `stringifyUrlEncoded(values)` formats an object as form text.
- `field(values, key)` returns a field value or `null`.
- `setField(values, key, value)` mutates and returns the object.

## Rules

The URL-encoded form helpers layer over `jayess:querystring`.

- `+` and `%20` decode to spaces.
- Empty values remain empty strings.
- Repeated fields use the last value.
- File upload and multipart form data are outside this helper surface.
