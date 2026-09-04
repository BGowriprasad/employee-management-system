# Employee Management System

A NestJS REST API for managing employees and departments with MySQL, TypeORM, JWT authentication, and role-based access control.

## Features

- User registration and login with bcrypt password hashing
- JWT authentication with configurable token expiration
- `user` and `admin` roles
- Employee and department CRUD operations
- Employee filtering, sorting, and pagination
- Department-to-employee relationship handling without circular responses
- Duplicate and relationship business rules
- Global request validation and security headers
- Login rate limiting
- Swagger/OpenAPI documentation
- Jest unit tests and Supertest end-to-end tests

## Tech Stack

| Technology | Purpose |
| --- | --- |
| NestJS | Application framework |
| TypeScript | Application language |
| MySQL | Relational database |
| TypeORM | ORM and migrations |
| Passport JWT | Token authentication |
| `@nestjs/throttler` | Login rate limiting |
| bcrypt | Password hashing |
| class-validator / class-transformer | DTO validation and transformation |
| Swagger / OpenAPI | Interactive API documentation |
| Jest / Supertest | Unit and E2E testing |
| ESLint | Static analysis and code quality |

## Architecture

The application is organized into NestJS modules:

- `auth`: login, JWT strategy, authentication guard, role guard, and profile access
- `users`: public user registration and user lookup for authentication
- `employees`: employee CRUD, filtering, sorting, pagination, and department assignment
- `departments`: department CRUD and employee relationship responses
- `common`: shared TypeORM exception handling
- `config`: environment validation

Requests pass through controllers and guards to services, which use TypeORM repositories or QueryBuilder against MySQL.

## Project Structure

```text
src/
├── auth/
├── common/
├── config/
├── departments/
├── employees/
├── users/
├── app.module.ts
├── data-source.ts
└── main.ts
test/
└── app.e2e-spec.ts
```

## Requirements

- Node.js
- npm
- MySQL

Create the database named by `DB_DATABASE` before running migrations.

## Setup

```bash
git clone https://github.com/BGowriprasad/employee-management-system.git
cd employee-management-system
npm install
```

Create `.env` from `.env.example` and provide valid values. Environment files are ignored by Git.

### Environment Variables

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-database-password
DB_DATABASE=employee_management_system

JWT_SECRET=your-random-secret-at-least-32-characters
JWT_EXPIRES_IN=1h

PORT=3002
```

Required variables are validated at startup. `DB_PORT` and `PORT` must be valid ports, and `JWT_SECRET` must be at least 32 characters. `PORT` defaults to `3002` when omitted.

For E2E tests, create `.env.test` with a separate test database, for example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-database-password
DB_DATABASE=employee_management_system_test
JWT_SECRET=your-test-secret-at-least-32-characters
JWT_EXPIRES_IN=1h
```

The `test:e2e` script sets `NODE_ENV=test`. E2E teardown requires this environment and a database name ending in `_test` before dropping the database.

## Database and Migrations

TypeORM uses MySQL with `synchronize: false`. Migrations run when the application starts.

```bash
npm run migration:run
npm run migration:revert
npm run migration:generate
npm run migration:create
```

The initial schema creates users, departments, employees, unique email/name constraints, and a restricted employee-to-department foreign key. A department with assigned employees cannot be deleted.

## Running the Application

```bash
npm run start       # Start normally
npm run start:dev   # Watch mode
npm run start:prod  # Run compiled dist output
```

The default base URL is `http://localhost:3002`.

## Authentication and RBAC

Register through `POST /users`, then log in through `POST /auth/login`:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

The login response contains an access token:

```json
{
  "access_token": "<JWT_TOKEN>"
}
```

Send it on protected requests:

```http
Authorization: Bearer <JWT_TOKEN>
```

The token contains the user ID, email, and role. Expired or invalid tokens return `401 Unauthorized`. Login is limited to 10 attempts per minute per client key.

| Operation | Authenticated user | Admin |
| --- | ---: | ---: |
| View employees | Yes | Yes |
| View departments | Yes | Yes |
| Create, update, or delete employees | No | Yes |
| Create, update, or delete departments | No | Yes |

## API Endpoints

All endpoints below are relative to `http://localhost:3002`.

### Users and Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/users` | Public | Register a user |
| `POST` | `/auth/login` | Public | Authenticate and receive a JWT |
| `GET` | `/auth/profile` | JWT | Return the authenticated user projection |

Passwords are never returned in the profile response.

### Employees

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/employees` | JWT | List employees |
| `GET` | `/employees/:id` | JWT | Get one employee with its department |
| `POST` | `/employees` | Admin | Create an employee |
| `PATCH` | `/employees/:id` | Admin | Partially update an employee |
| `DELETE` | `/employees/:id` | Admin | Delete an employee |

`GET /employees` supports:

- `page` and `limit` (positive integers; `limit` maximum is 100)
- `sortBy`: `id`, `name`, `email`, or `salary`
- `order`: `ASC` or `DESC`
- `minSalary` and `maxSalary` (numeric strings, including `0`)
- `department` (department name)

The list response has `data` and `meta` fields containing pagination details.

### Departments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/departments` | JWT | List departments with employees |
| `GET` | `/departments/:id` | JWT | Get one department with employees |
| `POST` | `/departments` | Admin | Create a department |
| `PATCH` | `/departments/:id` | Admin | Partially update a department |
| `DELETE` | `/departments/:id` | Admin | Delete an unassigned department |

Department responses include an `employees` array. Each nested employee omits its `department` back-reference to prevent circular serialization.

## Validation and Error Handling

The global `ValidationPipe` enables:

- DTO validation with `class-validator`
- Type transformation for request values
- Rejection of unknown properties
- Validation of route IDs, pagination, salary filters, email addresses, salaries, and required fields

Common responses include:

| Status | Meaning |
| --- | --- |
| `201` | Resource created or login completed |
| `200` | Successful read, update, or delete |
| `400` | Invalid input or deletion blocked by assigned employees |
| `401` | Missing, invalid, or expired JWT; invalid credentials |
| `403` | Authenticated user lacks the admin role |
| `404` | Requested employee, department, or referenced department does not exist |
| `409` | Duplicate user email, employee email, or department name |

## Swagger / OpenAPI

Start the application and open:

```text
http://localhost:3002/api-docs
```

Swagger documents the available routes and supports bearer-token authorization for protected requests.

## Security

- Passwords are hashed with bcrypt.
- JWT secrets and database credentials are environment-sourced.
- JWT expiration is enforced.
- Protected routes use JWT authentication; mutations additionally require the admin role.
- Login attempts are rate limited.
- Unknown request properties are rejected.
- SQL structure inputs such as sort fields and sort direction are allowlisted; filter values use bound parameters.
- Helmet security headers are enabled.
- CORS is enabled for the configured localhost frontend origins.
- Test teardown is restricted to an explicitly marked test environment and test database.

## Testing and Quality Checks

Run the unit tests:

```bash
npm test
```

Run the E2E suite against `.env.test`:

```bash
npm run test:e2e
```

Generate the Jest coverage report:

```bash
npm run test:cov
```

Run static analysis and compile the application:

```bash
npm run lint
npm run build
```

The E2E suite covers authentication failures, JWT expiration, RBAC, profile password exclusion, duplicate resources, relationship serialization, partial employee updates, validation boundaries, and deletion rules.

## License

This project is private and currently marked `UNLICENSED` in `package.json`.