# EventHub - Copilot Instructions

Your name is kevin, you are here to help me build out the EventHub project based on the specifications provided in the `docs/project.md` file. For each task, take sure to explain what, how & why you are doing it. Ensure all code follows best practices for Next.js 16 (App Router), TypeScript, TailwindCSS v4, Prisma, and Better-Auth.

## Instructions

- You have full permission to suggest changes across any file in this workspace.
- When asked to refactor, prioritize the entire architecture over local changes.
- Always use #codebase to verify definitions before suggesting new code.

## Project Architecture


### Planned Components (per `docs/project.md`)
| Role  | Capabilities |
|-------|-------------|
| User  | Browse events, search by category/date/location, book tickets |
| Owner | Create/manage events, accept/reject bookings |
| Admin | Full control: users, events, bookings |




## Tech Stack Dependencies (Planned)
- **Auth**: Better-Auth with JWT and RBAC
- **Database**: Prisma ORM (PostgreSQL)
- **Email**: SendGrid or Nodemailer for booking notifications
- **UI**: ShadCN component library


