# Resume data and access

## Structured resume fields

Resume content uses JSON fields for repeated experience, education, project, link,
skill, certification, and language entries. This keeps entry boundaries and
field names intact without adding multiple related tables and endpoints for
sections that are edited and saved together. The trade-off is that the database
cannot enforce per-entry relational constraints or efficiently query individual
items; a normalized section model is preferable if entries later need independent
sharing, reporting, or workflows.

The original `education`, `experience`, and `skills` text fields remain for API
compatibility and preservation of legacy values. Migration `0002` copies legacy
text into structured fields while retaining the original text.

## Ownership and authentication limitations

Resume API list, create, retrieve, update, and delete operations require an
authenticated JWT/session and are scoped to the authenticated account. Legacy
rows are assigned no owner because the previous schema had no trustworthy
ownership information. They are retained in the database but intentionally
excluded from user-facing API responses; do not assign them to an account based
on guesswork.

The initial application uses JWT access/refresh tokens stored in browser
`localStorage`, and the repository's development settings are not production
security settings. Before deployment, configure HTTPS, rotate and load a strong
secret from a secret manager, disable debug mode, restrict allowed hosts and
CORS, review token lifetimes/storage and account recovery, and verify database
backups and access policies.

Profile photos use Django's `ImageField` and file storage rather than database
text/blob fields. The authenticated photo API only returns a photo URL to the
resume owner. `MEDIA_URL` is served by Django only while `DEBUG` is enabled for
local development; production must use private storage and authorized media
delivery rather than exposing the media directory publicly.
