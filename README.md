# Webflow Project Hub

A client-facing project delivery workspace for a software studio. The React app has Admin, Employee, and Client dashboards. The Python API uses JWT access tokens and MySQL.

## Run the frontend

```sh
npm install
npm run dev
```

Sign-in, registration, notifications, and direct or support messaging connect to the API. The dashboard includes editable project steps and role-aware task controls. Some project, task, team, and contract actions still use sample workspace state in the frontend; the corresponding API routes are available for integration.

## Run the full Docker stack

```sh
cp .env.example .env
# Change the passwords and JWT secret in .env
./scripts/docker-up.sh
```

Open `http://localhost:8080`. The API docs are available at `http://localhost:8000/docs`. The initial admin is created from `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` when the API first starts. Set strong values before starting a shared environment.

Docker uses the named volumes `webflow_mysql_data` and `webflow_contracts_data`, preserving data across rebuilds. `./scripts/docker-up.sh` also creates these volumes for a fresh setup.

## Workflow represented by the API

- A client or employee creates a project and selects a project owner.
- The owner proposes multiple project teams, each with a required scrum master and member list. Team invitations start pending.
- An admin approves project setup. Task assignment is blocked until approval.
- Employees accept or decline invitations. A member can only work on one active task; task assignment can choose the highest level available for complex work.
- Clients and project teams can see project contracts. PDF uploads and amendments are tracked, and admin review is required before an amendment is active.
- A client submits a cancellation request; the project remains active until an admin approves it.

## API areas

`/auth` login, registration, current user · `/projects` projects · `/projects/{id}/teams` team proposals · `/invitations` employee decisions · `/projects/{id}/tasks` task queue · `/projects/{id}/contracts` PDF uploads · `/admin/*` admin review and controls.

Passwords are hashed and JWTs expire after 12 hours. Admin accounts are provisioned from environment settings; public registration cannot create an admin. Contract files are stored in the Docker `contracts_data` volume. Database tables are created on API startup; production deployments should replace this with versioned migrations and configure a real AI provider for contract task extraction.
