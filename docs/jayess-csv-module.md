# Jayess `jayess:csv` Module

`jayess:csv` provides small CSV helpers written in Jayess.

## Surface

- `parse(text)` returns an array of row arrays.
- `stringify(rows)` returns CSV text from an array of row arrays.

## Rules

- Commas split unquoted cells.
- Double quotes wrap quoted cells.
- Escaped quotes inside quoted cells use `""`.
- Newlines split records when they appear outside quotes.
- Carriage returns outside quotes are ignored for CRLF input.

Values passed to `stringify` should already be strings. The helper quotes cells containing a comma, quote, or newline.
