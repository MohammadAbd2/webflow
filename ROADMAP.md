# Webflow Project Hub improvement roadmap

## Goal

Make the client, employee, and admin dashboards reliable views of the same project data, with clear role rules, persisted actions, useful feedback on failures, and no misleading demo actions in signed-in workflows.

## Phase 1 — Close the highest-impact frontend/API gaps (in progress)

- [x] Record the roadmap and audit the existing API/UI overlap.
- [x] Persist project step edits and client cancellation requests from the UI.
- [x] Load and respond to real employee invitations in the employee dashboard.
- [x] Replace hard-coded success feedback for these flows with API results/errors.

## Phase 2 — Make project delivery data consistent

- Persist and display project progress per configured step, including correct owner/admin permissions.
- [x] Load project teams, employee invitations, and active-project tasks from the API.
- [x] Load stored contracts and signatures from the API; connect contract signing, amendment requests, and admin review.
- [x] Connect admin cancellation review to the persisted cancellation queue.
- [ ] Load project teams, task assignments, contracts, and approval queues consistently across every relevant dashboard.
- Keep client-visible project status read-only and derive it from server state.
- Replace sample dashboard totals and activity with API-backed values; show useful empty/loading/error states.

## Phase 3 — Finish task lifecycle integration

- [x] Allow project employees and admins to create tasks directly into the backlog or a project sprint.
- [x] Add searchable, avatar-backed owner and assignee pickers; require a project before task creation.
- [x] Allow project setup to add, rename, and remove teams.
- [x] Improve employee profile editing and add repeatable local demo accounts/data.
- [x] Connect signed-in project creation and initial team submission to the API; search for the client account during setup.
- [x] Complete dark theme contrast for navigation, forms, dialogs, tables, and messaging surfaces.
- Add task comments/activity, editing, deletion, and duplication APIs with project membership checks.
- Keep task queue, sprint review, team member task lists, and completion rewards synchronized with server state.
- Connect AI task drafting to a real provider only when configured; retain a clearly labeled local draft fallback.

## Phase 4 — Complete contracts, messaging, notifications, and admin controls

- [x] Load contracts per project, persist signatures/amendment requests, and show admin review decisions.
- Verify message delivery/read state and notification targets against persisted conversations and user access.
- [ ] Connect remaining account/tag controls and invitation/approval counts to the database.

## Phase 5 — Reliability, security, and release readiness

- Add versioned database migrations and remove startup-only schema alteration code.
- Add API and frontend integration coverage for the client → owner → scrum master → admin → employee lifecycle.
- Review authorization boundaries, data validation, upload limits, and error handling.
- Document environment setup, Docker/dev URLs, bootstrap credentials, backup, and recovery steps.

## Phase 6 — Current requested improvements

- [x] Fix sprint assignment and AI task generation, including selecting a team and sprint before adding generated drafts.
- [x] Make product-owner search and empty/error states dependable, and let admins manage role tags used by these searches.
- [x] Add admin people controls for account type, activation/suspension, and contacting a user.
- [x] Replace the navbar global search with a cleaner header and finish the dark palette around the brand colors.
- [x] Present employee profiles as a full-page case-study view with images, descriptions, links, and aligned services/portfolio.
- [x] Add service-level client reviews after project completion, with admin moderation and rating controls.
- [ ] Review the remaining authenticated actions for local-only state, permission mismatches, and misleading confirmation.

## Working rules

- Implement one complete workflow slice at a time, including API authorization, UI loading/error/success states, and persistence checks.
- Keep local preview data visibly separate from authenticated, server-backed data.
- Update this checklist when a phase item is completed or a new blocking gap is found.

## Phase 7 — Client requests and team coordination

- [x] Expand the client request workspace, personalize client labels, and add editable organization and telephone fields.
- [x] Paginate People & teams at 25 users per page and notify users of role and tag changes.
- [x] Add an admin client-request queue with status management and date-filtered bulk actions.
- [x] Give Scrum masters a Teams workspace for reusable rosters and employee invitations with accept/decline notifications.
- [x] Let project owners generate editable suggestions, search for Scrum masters, and select reusable teams. Give admins member-level review before approving project invitations.
- [x] Let Scrum masters invite selected employees from multiple rosters to their approved project teams.
- [x] Verify the workflows through API integration tests and a production-build/Docker HTTP smoke test; apply them to the local Docker app.

## Phase 8 — Project teams, activity, and role-based reviews

- [x] Fix the live Project teams view for numeric account IDs and open member profiles from a selected team.
- [x] Replace fabricated dashboard and project activity with persisted notification events.
- [x] Preview the exact requests matched by admin bulk status/date actions.
- [x] Move ratings from employee profiles into completed project workflows: client → product owner → scrum master → accepted team members.
- [x] Restrict delivery-step edits to project owners tagged as product owners and administrators.
- [x] Verify role-specific review permissions and rebuild/smoke-test the team/activity screens in the local app.

## Phase 9 — Account photos, admin status controls, and readability

- [x] Store uploaded account photos on the API and use the shared URL for account and team-member avatars.
- [x] Let admins mark projects completed, canceled, or reopened from project status controls and the approval workspace.
- [x] Show live project details/statuses in Review & approvals rather than a count-only approved-project summary.
- [x] Let admins record client/product-owner contract signatures and delete contract files with confirmation.
- [x] Improve role selector presentation and raise small-text readability across the app.
- [x] Verify API authorization, persisted image retrieval, contract file deletion, project status transitions, frontend build, and Docker smoke checks.
