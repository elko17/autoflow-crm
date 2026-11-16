# AutoFlow CRM

AutoFlow is a role-based CRM starter for automotive service centers. It provides a manager workspace for customer, vehicle, and work-order operations, plus a mechanic workspace for assigned jobs.

## Product capabilities

- Secure email/password sign-in with bcrypt password hashing
- PostgreSQL-backed accounts and persistent CRM records
- Server-side sessions in HttpOnly cookies; no browser localStorage tokens
- Manager and mechanic role separation, enforced in server pages and server actions
- Mechanics see only their assigned work orders and can update only those jobs
- Manager can create and delete work orders, assign mechanics, and view operating totals
- Russian, Kyrgyz, and English interface language selector

## Stack

Next.js App Router, React, TypeScript, PostgreSQL, `pg`, and `bcryptjs`.

## Local setup

See [Authentication and deployment setup](docs/AUTH_SETUP.md) for the complete setup guide. Short version:

1. Create a PostgreSQL database and set `DATABASE_URL` in `.env.local`.
2. Run `npm install`.
3. Apply `db/migrations/001_auth.sql` and `db/migrations/002_crm_data.sql`.
4. Create a manager with `npm run user:create`; create staff accounts with the same command.
5. Run `npm run dev`.

## Important

This repository is a production-oriented foundation, not a claim of completed enterprise certification. Before handling real customer data, deploy behind HTTPS, configure database backups and monitoring, review privacy/retention obligations, and run automated integration/security tests in the target environment. Public self-registration is intentionally disabled; staff accounts are provisioned by an administrator.

## Development

```bash
npm run dev
npm run lint
npm run build
```
