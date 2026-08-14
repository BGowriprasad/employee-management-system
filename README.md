# Employee Management System

A backend REST API for managing employees and departments, built with **NestJS, TypeScript, MySQL, and TypeORM**.

The application provides **JWT-based authentication, Role-Based Access Control (RBAC), employee and department management, DTO validation, filtering, and business-rule validation**.

---

## 🚀 Features

- User registration
- User login with email and password
- Password hashing using bcrypt
- JWT authentication
- JWT protected routes
- Role-Based Access Control (RBAC)
- User and Admin roles
- Employee CRUD operations
- Department CRUD operations
- Employee and Department relationship
- Employee filtering by:
  - Minimum salary
  - Maximum salary
  - Department
- Dynamic filtering using TypeORM QueryBuilder
- DTO validation using class-validator
- Global ValidationPipe
- HTTP exception handling
- Duplicate department protection
- Prevent deletion of departments that have employees assigned
- Environment-based configuration
- MySQL database integration using TypeORM
- ESLint code quality checks
- TypeScript production build

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend framework |
| TypeScript | Programming language |
| MySQL | Database |
| TypeORM | ORM and database interaction |
| JWT | Authentication |
| Passport | JWT authentication strategy |
| bcrypt | Password hashing |
| class-validator | Request validation |
| class-transformer | DTO transformation |
| ESLint | Code quality |

---

# 📁 Project Structure

```text
employee-management-system/
│
├── src/
│   │
│   ├── auth/
│   │   ├── dto/
│   │   ├── get-user/
│   │   ├── jwt-auth/
│   │   ├── jwt.strategy/
│   │   └── roles/
│   │
│   ├── users/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── employees/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── employees.controller.ts
│   │   ├── employees.service.ts
│   │   └── employees.module.ts
│   │
│   ├── departments/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── departments.controller.ts
│   │   ├── departments.service.ts
│   │   └── departments.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

# 🔐 Authentication

The application uses **JWT (JSON Web Token)** for authentication.

## Authentication Flow

```text
User
 │
 ▼
Register
 │
 ▼
Password hashed using bcrypt
 │
 ▼
User stored in MySQL
 │
 ▼
Login
 │
 ▼
Email + Password validation
 │
 ▼
JWT generated
 │
 ▼
Client receives access token
 │
 ▼
Token sent with protected requests
```

Protected requests use:

```http
Authorization: Bearer <access_token>
```

---

# 🔑 JWT Payload

After successful login, the JWT contains information such as:

```json
{
  "sub": 1,
  "email": "user@example.com",
  "role": "user"
}
```

The JWT strategy validates the token and makes the authenticated user available through:

```text
request.user
```

---

# 👥 Role-Based Access Control

The application implements **RBAC (Role-Based Access Control)**.

Currently supported roles:

- `user`
- `admin`

RBAC is implemented using:

- `JwtAuthGuard`
- `RolesGuard`
- `@Roles()` decorator

## User Permissions

| Operation | User |
|---|---:|
| View employees | ✅ |
| View departments | ✅ |
| Create employee | ❌ |
| Update employee | ❌ |
| Delete employee | ❌ |
| Create department | ❌ |
| Update department | ❌ |
| Delete department | ❌ |

## Admin Permissions

| Operation | Admin |
|---|---:|
| View employees | ✅ |
| View departments | ✅ |
| Create employee | ✅ |
| Update employee | ✅ |
| Delete employee | ✅ |
| Create department | ✅ |
| Update department | ✅ |
| Delete department | ✅ |

---

# 👤 User API

## Register User

```http
POST /users
```

Example:

```json
{
  "name": "Gowri",
  "email": "gowri@gmail.com",
  "password": "password123",
  "role": "user"
}
```

The password is hashed using **bcrypt** before it is stored in the database.

---

# 🔐 Authentication API

## Login

```http
POST /auth/login
```

Example request:

```json
{
  "email": "gowri@gmail.com",
  "password": "password123"
}
```

Example response:

```json
{
  "access_token": "<JWT_TOKEN>"
}
```

Use the returned token for protected endpoints:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Get Profile

```http
GET /auth/profile
```

Requires:

```http
Authorization: Bearer <JWT_TOKEN>
```

Example response:

```json
{
  "userId": 1,
  "email": "gowri@gmail.com",
  "role": "admin"
}
```

---

# 👨‍💼 Employee API

Base URL:

```text
http://localhost:3002/employees
```

Employee management uses TypeORM repositories and QueryBuilder.

---

## Get All Employees

```http
GET /employees
```

Example:

```http
GET http://localhost:3002/employees
```

Authentication:

```text
Required
```

---

## Filter Employees

Employees can be filtered using query parameters.

### Minimum Salary

```http
GET /employees?minSalary=50000
```

### Maximum Salary

```http
GET /employees?maxSalary=80000
```

### Department

```http
GET /employees?department=IT
```

### Multiple Filters

```http
GET /employees?minSalary=50000&maxSalary=80000&department=IT
```

The filtering is implemented using **TypeORM QueryBuilder**.

---

## Get Employee by ID

```http
GET /employees/:id
```

Example:

```http
GET /employees/1
```

---

## Create Employee

Admin access required.

```http
POST /employees
```

Example request:

```json
{
  "name": "John",
  "email": "john@gmail.com",
  "salary": 60000,
  "departmentId": 1
}
```

---

## Update Employee

Admin access required.

```http
PATCH /employees/:id
```

Example:

```http
PATCH /employees/1
```

Request:

```json
{
  "salary": 70000
}
```

Only the fields that need to be updated have to be provided.

---

## Delete Employee

Admin access required.

```http
DELETE /employees/:id
```

Example:

```http
DELETE /employees/1
```

---

# 🏢 Department API

Base URL:

```text
http://localhost:3002/departments
```

---

## Get All Departments

```http
GET /departments
```

---

## Get Department by ID

```http
GET /departments/:id
```

Example:

```http
GET /departments/1
```

---

## Create Department

Admin access required.

```http
POST /departments
```

Example:

```json
{
  "name": "IT",
  "location": "Hyderabad"
}
```

---

## Update Department

Admin access required.

```http
PATCH /departments/:id
```

Example:

```http
PATCH /departments/1
```

Request:

```json
{
  "location": "Bangalore"
}
```

---

## Delete Department

Admin access required.

```http
DELETE /departments/:id
```

Example:

```http
DELETE /departments/1
```

---

# 🛡️ Business Rules

## Duplicate Department Protection

Department names are unique.

If a department with the same name already exists, the API returns:

```http
409 Conflict
```

Example:

```json
{
  "message": "Department with name 'IT' already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

---

## Prevent Department Deletion When Employees Are Assigned

A department cannot be deleted while employees are assigned to it.

Example response:

```http
400 Bad Request
```

```json
{
  "message": "Cannot delete department because employees are assigned to it",
  "error": "Bad Request",
  "statusCode": 400
}
```

This prevents accidental deletion of a department that is still being used by employees.

---

# ✅ Validation

The application uses NestJS's global `ValidationPipe`.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Validation Features

#### `whitelist`

Removes properties that are not defined in the DTO.

#### `forbidNonWhitelisted`

Rejects requests containing unexpected properties.

#### `transform`

Enables transformation of incoming request data.

DTO validation is implemented using `class-validator`.

Examples:

```typescript
@IsString()
@IsNotEmpty()

@IsEmail()

@IsNumber()
```

---

# 🗄️ Database

The application uses:

```text
MySQL
   ↓
TypeORM
   ↓
NestJS Services
```

Database configuration is provided through environment variables.

---

# 🔗 Database Relationship

A department can have multiple employees.

```text
Department
     │
     │ 1
     │
     │
     │ *
     ▼
Employee
```

The relationship is implemented using TypeORM:

```typescript
@OneToMany()
```

and:

```typescript
@ManyToOne()
```

This allows employees to be associated with departments.

---

# 🔄 Application Request Flow

A protected API request follows this flow:

```text
Client
  │
  ▼
Controller
  │
  ▼
JwtAuthGuard
  │
  ▼
JWT Strategy
  │
  ▼
RolesGuard
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
TypeORM Repository / QueryBuilder
  │
  ▼
MySQL
  │
  ▼
Response
```

---

# ⚙️ Environment Configuration

Create a `.env` file in the project root.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=YOUR_DB_PASSWORD
DB_DATABASE=employee_management_system

JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=1h

PORT=3002
```

### Important

Never commit your real `.env` file to GitHub.

The project uses `.gitignore` to prevent environment files containing secrets from being committed.

Use `.env.example` when sharing the project.

Example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=employee_management_system

JWT_SECRET=
JWT_EXPIRES_IN=1h

PORT=3002
```

---

# 📦 Installation

## 1. Clone the repository

```bash
git clone <your-repository-url>
```

## 2. Navigate to the project

```bash
cd employee-management-system
```

## 3. Install dependencies

```bash
npm install
```

## 4. Configure environment variables

Create a `.env` file:

```text
.env
```

Add your MySQL and JWT configuration.

---

# ▶️ Running the Application

## Development

```bash
npm run start
```

## Development Watch Mode

```bash
npm run start:dev
```

## Production

```bash
npm run start:prod
```

The application runs on:

```text
http://localhost:3002
```

unless a different port is provided through the `PORT` environment variable.

---

# 🧪 Build and Code Quality

## Build

Compile the NestJS application:

```bash
npm run build
```

## ESLint

Run ESLint:

```bash
npm run lint
```

The project should pass both checks before committing changes.

---

# 📋 API Summary

## Authentication

| Method | Endpoint | Authentication |
|---|---|---|
| POST | `/users` | Public |
| POST | `/auth/login` | Public |
| GET | `/auth/profile` | JWT |

## Employees

| Method | Endpoint | Access |
|---|---|---|
| GET | `/employees` | Authenticated |
| GET | `/employees/:id` | Authenticated |
| POST | `/employees` | Admin |
| PATCH | `/employees/:id` | Admin |
| DELETE | `/employees/:id` | Admin |

## Departments

| Method | Endpoint | Access |
|---|---|---|
| GET | `/departments` | Authenticated |
| GET | `/departments/:id` | Authenticated |
| POST | `/departments` | Admin |
| PATCH | `/departments/:id` | Admin |
| DELETE | `/departments/:id` | Admin |

---

# 🔒 Security

The application includes several security-related practices:

- Passwords are hashed using bcrypt.
- JWT secrets are stored in environment variables.
- Protected endpoints use JWT authentication.
- Role-based authorization is implemented through guards.
- DTO validation prevents invalid request data.
- Unknown request properties can be rejected.
- Departments with assigned employees cannot be deleted.

---

# 🚧 Future Improvements

The current version focuses on the core Employee Management System functionality.

Possible future improvements include:

- Swagger / OpenAPI documentation
- Pagination
- Sorting
- TypeORM migrations
- Automated unit tests
- Integration tests
- API rate limiting
- Refresh tokens
- Password reset
- Centralized logging
- Production deployment
- Docker support

These are planned improvements and are **not part of the current core implementation**.

---

# 👨‍💻 Author

**Gowri Prasad**

---

## 📄 License

This project is created for learning and portfolio purposes.