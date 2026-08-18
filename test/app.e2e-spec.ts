import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';

interface LoginResponse {
  access_token: string;
}

interface DepartmentResponse {
  id: number;
}

describe('Employee Management System (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
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

  it('GET /employees should reject unauthenticated requests', async () => {
    return request(app.getHttpServer()).get('/employees').expect(401);
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
});
