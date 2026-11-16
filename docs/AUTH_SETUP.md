# AutoFlow CRM — production authentication setup

Authentication uses PostgreSQL-backed accounts and sessions. Passwords are hashed with bcrypt (cost 12); session tokens are random 256-bit values, stored only as SHA-256 hashes, and sent to the browser in an HttpOnly cookie. No access token is exposed to JavaScript or localStorage.

## Requirements

- Node.js 20+
- PostgreSQL 14+
- A trusted HTTPS deployment in production

## Configure

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
3. Install dependencies with `npm install`.
4. Apply both database migrations in order:

   ```bash
   psql "$DATABASE_URL" -f db/migrations/001_auth.sql
   psql "$DATABASE_URL" -f db/migrations/002_crm_data.sql
   ```

5. Create the first manager account:

   ```bash
   npm run user:create
   ```

   Choose role `manager`. Repeat for each mechanic with role `mechanic`. Accounts are provisioned by an operator; public self-registration is intentionally disabled.

6. Start the app:

   ```bash
   npm run dev
   ```

## Security behavior

- Login requires a real email/password match. Unknown, disabled, and incorrect-password accounts receive the same response.
- Failed login attempts are rate-limited per IP/email fingerprint (8 attempts per 15-minute window).
- Session cookie is HttpOnly, SameSite=Lax, path-wide, and Secure in production.
- Sessions expire after 7 days and are invalidated on logout.
- Manager and mechanic routes are checked on the server. Server actions independently enforce role and record ownership.
- Never commit `.env.local`, database credentials, or real customer data.

## Important deployment notes

- Set `NODE_ENV=production` and terminate TLS at a trusted platform/load balancer.
- Keep PostgreSQL private and use a least-privilege database user.
- Configure backups, monitoring, and a scheduled cleanup for expired rows:
  `DELETE FROM auth_sessions WHERE expires_at < NOW();`
- Clients, vehicles, and work orders are stored in PostgreSQL with foreign keys, indexes, and transactional order creation. A new database starts empty; create staff accounts and add customer/vehicle records through the manager dashboard. Back up this database before launch.
