import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUser = {
    username: 'testuser',
    password: 'testpassword',
    role: 'ADMIN' as const
  };

  const adminUser = {
    username: 'admin',
    password: 'adminpass',
    role: 'ADMIN' as const
  };

  const studentUser = {
    username: 'student123',
    password: 'studentpass',
    role: 'SISWA' as const
  };

  it('should authenticate valid user credentials', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const loginInput: LoginInput = {
      username: 'testuser',
      password: 'testpassword'
    };

    const result = await login(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('testuser');
    expect(result!.role).toEqual('ADMIN');
    expect(result!.password).toEqual(''); // Password should be empty for security
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent username', async () => {
    const loginInput: LoginInput = {
      username: 'nonexistent',
      password: 'anypassword'
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const loginInput: LoginInput = {
      username: 'testuser',
      password: 'wrongpassword'
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });

  it('should authenticate admin user', async () => {
    // Create admin user
    await db.insert(usersTable)
      .values(adminUser)
      .execute();

    const loginInput: LoginInput = {
      username: 'admin',
      password: 'adminpass'
    };

    const result = await login(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('admin');
    expect(result!.role).toEqual('ADMIN');
    expect(result!.password).toEqual('');
  });

  it('should authenticate student user', async () => {
    // Create student user
    await db.insert(usersTable)
      .values(studentUser)
      .execute();

    const loginInput: LoginInput = {
      username: 'student123',
      password: 'studentpass'
    };

    const result = await login(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('student123');
    expect(result!.role).toEqual('SISWA');
    expect(result!.password).toEqual('');
  });

  it('should handle empty username', async () => {
    const loginInput: LoginInput = {
      username: '',
      password: 'anypassword'
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });

  it('should handle empty password', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const loginInput: LoginInput = {
      username: 'testuser',
      password: ''
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });

  it('should be case sensitive for username', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const loginInput: LoginInput = {
      username: 'TESTUSER', // Different case
      password: 'testpassword'
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });

  it('should be case sensitive for password', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const loginInput: LoginInput = {
      username: 'testuser',
      password: 'TESTPASSWORD' // Different case
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });

  it('should handle multiple users with same password correctly', async () => {
    // Create multiple users with different usernames but same password
    const users = [
      { username: 'user1', password: 'samepass', role: 'ADMIN' as const },
      { username: 'user2', password: 'samepass', role: 'SISWA' as const },
      { username: 'user3', password: 'samepass', role: 'ADMIN' as const }
    ];

    await db.insert(usersTable)
      .values(users)
      .execute();

    // Test login for each user
    for (const user of users) {
      const loginInput: LoginInput = {
        username: user.username,
        password: 'samepass'
      };

      const result = await login(loginInput);

      expect(result).not.toBeNull();
      expect(result!.username).toEqual(user.username);
      expect(result!.role).toEqual(user.role);
      expect(result!.password).toEqual('');
    }
  });

  it('should handle special characters in credentials', async () => {
    const specialUser = {
      username: 'user@domain.com',
      password: 'P@ssw0rd!123',
      role: 'ADMIN' as const
    };

    await db.insert(usersTable)
      .values(specialUser)
      .execute();

    const loginInput: LoginInput = {
      username: 'user@domain.com',
      password: 'P@ssw0rd!123'
    };

    const result = await login(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('user@domain.com');
    expect(result!.password).toEqual('');
  });
});