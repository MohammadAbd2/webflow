# Webflow Project Hub

A client-facing project delivery workspace for a software studio. The React app has Admin, Employee, and Client dashboards. The Python API uses JWT access tokens and MySQL.

## Run the frontend

```sh
npm install
npm run dev
```

Sign-in, registration, notifications, direct/support messaging, authenticated PDF uploads, and shared account profile photos connect to the API. Client project requests and replies, accepted projects, team proposals and reviews, employee profile details, role-based completed-project reviews, dated sprints, and approved-project tasks connect to MySQL. Administrators can manage project completion/cancellation, approve contract changes, record party signatures, and delete contracts. Clients review product owners, product owners review project scrum masters, and scrum masters review accepted members of teams they lead. Persisted task creation uses the API assignment rules, which enforce one active task per teammate and route complex work toward the highest-level available member. Completing a persisted task updates the API. Browser-only preview/sample dashboards and unsaved presentation preferences remain local. AI task generation turns each prompt line into a draft task; it is a local drafting aid, not an external AI integration.

## Run the full Docker stack

```sh
cp .env.example .env
# Change the passwords and JWT secret in .env
./scripts/docker-up.sh
```

Open `http://localhost:8080`. The API docs are available at `http://localhost:8000/docs`. The initial admin is created from `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` when the API first starts. Set strong values before starting a shared environment.

Docker uses the named volumes `webflow_mysql_data` and `webflow_contracts_data`, preserving data across rebuilds. `./scripts/docker-up.sh` also creates these volumes for a fresh setup.

## Seed local demo data

To populate a local development database with searchable demo clients, product owners, scrum masters, employees, projects, teams, invitations, tasks, sprints, a conversation, notifications, and a sample contract, run:

```sh
docker compose exec api python -m app.seed_demo
```

The seed is idempotent and is never run automatically. Demo accounts use `WebflowDemo123!` by default; override `WEBFLOW_DEMO_PASSWORD` in `.env` before seeding. Example accounts include `demo.admin@example.com`, `demo.owner@example.com`, `demo.scrum@example.com`, `demo.frontend@example.com`, and `demo.client@example.com`. This shared password is for local testing only.

Create the optional local administrator with `docker compose exec api python -m app.seed_demo --local-admin`. Sign in with username `admin` and password `admin`. The web container binds to localhost by default. Use these credentials only on a local development stack, and change the password in Settings before exposing it over the network.


## Workflow represented by the API

- A client or employee creates a project and selects a project owner.
- The client posts a project request to product owners or selects a specific owner. The owner accepts and proposes steps and teams.
- Each team has one tagged scrum master. Scrum masters confirm or suggest member edits; the owner accepts edits before admin review.
- An admin approves project setup. Task assignment is blocked until approval.
- Employees accept or decline invitations. A member can only work on one active task; task assignment can choose the highest level available for complex work.
- Clients and project teams can see project contracts. PDF uploads and amendments are tracked, and admin review is required before an amendment is active.
- A client submits a cancellation request; the project remains active until an admin approves it.

## API areas

`/auth` login, registration, current user · `/users` employee directory and tags · `/projects` projects · `/projects/{id}/teams` team proposals · `/teams/{id}/review` scrum master review and `/teams/{id}/review/owner` owner approval · `/invitations` employee decisions · `/projects/{id}/tasks` task queue · `/projects/{id}/contracts` PDF uploads · `/admin/*` admin review and controls.

Passwords are hashed and JWTs expire after 12 hours. Admin accounts are provisioned from environment settings; public registration cannot create an admin. Contract files are stored in the Docker `contracts_data` volume. Database tables are created on API startup; production deployments should replace this with versioned migrations and configure a real AI provider for contract task extraction.
