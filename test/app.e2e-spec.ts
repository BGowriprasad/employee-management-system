import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './../src/app.module';

interface LoginResponse {
  access_token: string;
}

interface DepartmentResponse {
  id: number;
}

interface ProfileResponse {
  email: string;
  role: string;
  password?: string;
}

interface EmployeeResponse {
  id: number;
}

interface DepartmentWithEmployeesResponse {
  employees: Array<{ department?: unknown }>;
}

describe('Employee Management System (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('E2E tests require NODE_ENV=test');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    const database = String(dataSource.options.database ?? '');
    if (process.env.NODE_ENV === 'test' && database.endsWith('_test')) {
      await dataSource.dropDatabase();
    }
    await app.close();
  });

  it('should start the application', () => {
    expect(app).toBeDefined();
  });

  it('POST /auth/login should reject invalid credentials', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'invalid@test.com',
        password: 'wrongpassword',
      })
      .expect(401);
  });
  it('POST /users should reject duplicate emails and profile should omit passwords', async () => {
    const email = `profile${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Profile User',
        email,
        password: 'password123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Duplicate User',
        email,
        password: 'password123',
      })
      .expect(409);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    const loginBody = loginResponse.body as LoginResponse;

    const profileResponse = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${loginBody.access_token}`)
      .expect(200);

    const profileBody = profileResponse.body as ProfileResponse;
    expect(profileBody).toMatchObject({ email, role: 'user' });
    expect(profileBody.password).toBeUndefined();
  });

  it('GET /employees should reject unauthenticated requests', async () => {
    return request(app.getHttpServer()).get('/employees').expect(401);
  });

  it('GET /auth/profile should reject an invalid JWT', async () => {
    return request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .expect(401);
  });

  it('GET /auth/profile should reject an expired JWT', async () => {
    const jwtService = app.get(JwtService);
    const expiredToken = await jwtService.signAsync(
      {
        sub: 1,
        email: 'expired@example.com',
        role: 'user',
      },
      { expiresIn: -1 },
    );

    return request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('POST /employees should reject a normal user', async () => {
    const email = `testuser${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Test User',
        email,
        password: 'password123',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'password123',
      })
      .expect(201);

    const loginBody = loginResponse.body as LoginResponse;
    const accessToken = loginBody.access_token;

    return request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Unauthorized Employee',
        email: `employee${Date.now()}@example.com`,
        salary: 50000,
        departmentId: 1,
      })
      .expect(403);
  });

  it('POST /employees should allow an admin user', async () => {
    const email = `admin${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Test Admin',
        email,
        password: 'password123',
      })
      .expect(201);

    const userRepository = dataSource.getRepository('User');

    await userRepository.update({ email }, { role: 'admin' });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'password123',
      })
      .expect(201);

    const loginBody = loginResponse.body as LoginResponse;
    const accessToken = loginBody.access_token;

    const departmentResponse = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Test Department ${Date.now()}`,
        location: 'Hyderabad',
      })
      .expect(201);

    const departmentBody = departmentResponse.body as DepartmentResponse;
    const departmentId = departmentBody.id;

    return request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Admin Test Employee',
        email: `adminemployee${Date.now()}@example.com`,
        salary: 60000,
        departmentId,
      })
      .expect(201);
  });

  it('admin workflow should enforce employee and department business rules', async () => {
    const suffix = Date.now();
    const adminEmail = `workflow-admin${suffix}@example.com`;
    const employeeEmail = `workflow-employee${suffix}@example.com`;

    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Workflow Admin',
        email: adminEmail,
        password: 'password123',
      })
      .expect(201);

    await dataSource
      .getRepository('User')
      .update({ email: adminEmail }, { role: 'admin' });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: 'password123' })
      .expect(201);

    const accessToken = (loginResponse.body as LoginResponse).access_token;
    const departmentName = `Workflow Department ${suffix}`;

    const departmentResponse = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: departmentName, location: 'Hyderabad' })
      .expect(201);

    const departmentId = (departmentResponse.body as DepartmentResponse).id;

    await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Missing Location ${suffix}` })
      .expect(400);

    await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: departmentName, location: 'Bangalore' })
      .expect(409);

    await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Missing Department Employee',
        email: `missing-department${suffix}@example.com`,
        salary: 50000,
        departmentId: departmentId + 999,
      })
      .expect(404);

    const employeeResponse = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Workflow Employee',
        email: employeeEmail,
        salary: 50000,
        departmentId,
      })
      .expect(201);

    const employeeBody = employeeResponse.body as EmployeeResponse;
    const employeeId = employeeBody.id;

    await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Duplicate Employee',
        email: employeeEmail,
        salary: 55000,
        departmentId,
      })
      .expect(409);

    const departmentWithEmployees = await request(app.getHttpServer())
      .get(`/departments/${departmentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const departmentBody =
      departmentWithEmployees.body as DepartmentWithEmployeesResponse;
    expect(departmentBody.employees).toHaveLength(1);
    expect(departmentBody.employees[0].department).toBeUndefined();

    await request(app.getHttpServer())
      .get('/employees?minSalary=0&maxSalary=0')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/employees?minSalary=not-a-number')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .get('/employees?limit=101')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    const updatedEmployee = await request(app.getHttpServer())
      .patch(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Workflow Employee' })
      .expect(200);

    expect(updatedEmployee.body).toMatchObject({
      id: employeeId,
      name: 'Updated Workflow Employee',
      email: employeeEmail,
      department: { id: departmentId },
    });

    await request(app.getHttpServer())
      .patch(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ departmentId: departmentId + 999 })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/departments/${departmentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/departments/${departmentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('POST /auth/login should rate-limit repeated attempts', async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `rate-limit-${attempt}@example.com`,
          password: 'wrong',
        });

      if (attempt < 5) {
        expect(response.status).toBe(401);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });
});
