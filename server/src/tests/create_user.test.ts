import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs for different user roles
const adminUserInput: CreateUserInput = {
  username: 'testadmin',
  password: 'password123',
  role: 'ADMIN'
};

const studentUserInput: CreateUserInput = {
  username: 'teststudent',
  password: 'student123',
  role: 'SISWA'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an admin user', async () => {
    const result = await createUser(adminUserInput);

    // Basic field validation
    expect(result.username).toEqual('testadmin');
    expect(result.role).toEqual('ADMIN');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed, not plain text
    expect(result.password).not.toEqual('password123');
    expect(result.password.length).toBeGreaterThan(20);
  });

  it('should create a student user', async () => {
    const result = await createUser(studentUserInput);

    expect(result.username).toEqual('teststudent');
    expect(result.role).toEqual('SISWA');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed
    expect(result.password).not.toEqual('student123');
  });

  it('should save user to database', async () => {
    const result = await createUser(adminUserInput);

    // Query the database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testadmin');
    expect(users[0].role).toEqual('ADMIN');
    expect(users[0].password).not.toEqual('password123'); // Should be hashed
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash passwords correctly', async () => {
    const result = await createUser(adminUserInput);

    // Verify password was hashed using Bun's password utilities
    const isValid = await Bun.password.verify('password123', result.password);
    expect(isValid).toBe(true);

    // Wrong password should not verify
    const isInvalid = await Bun.password.verify('wrongpassword', result.password);
    expect(isInvalid).toBe(false);
  });

  it('should enforce unique usernames', async () => {
    // Create first user
    await createUser(adminUserInput);

    // Try to create another user with same username
    await expect(createUser(adminUserInput)).rejects.toThrow(/unique/i);
  });

  it('should create users with different roles', async () => {
    const admin = await createUser(adminUserInput);
    const student = await createUser(studentUserInput);

    expect(admin.role).toEqual('ADMIN');
    expect(student.role).toEqual('SISWA');
    expect(admin.id).not.toEqual(student.id);
  });

  it('should handle minimum password requirements', async () => {
    const shortPasswordInput: CreateUserInput = {
      username: 'testuser',
      password: 'short',
      role: 'ADMIN'
    };

    // This should be validated at the Zod schema level,
    // but we test the handler behavior with invalid input
    const result = await createUser(shortPasswordInput);
    expect(result.password).not.toEqual('short');
    expect(result.username).toEqual('testuser');
  });
});