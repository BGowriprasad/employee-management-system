import { describe, expect, it } from '@jest/globals';
import { validate } from './env.validation';

const validConfig = {
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USERNAME: 'root',
  DB_PASSWORD: 'password',
  DB_DATABASE: 'employee_management_system',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRES_IN: '1h',
};

describe('environment validation', () => {
  it('rejects a short JWT secret', () => {
    expect(() => validate({ ...validConfig, JWT_SECRET: 'too-short' })).toThrow(
      'Environment validation failed',
    );
  });
});
