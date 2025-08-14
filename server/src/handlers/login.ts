import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginInput, type User } from '../schema';

export async function login(input: LoginInput): Promise<User | null> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // In a real implementation, you would hash the input password and compare with stored hash
    // For this implementation, we'll do a direct comparison (not recommended for production)
    if (user.password !== input.password) {
      return null; // Invalid password
    }

    // Return user data without password for security
    return {
      id: user.id,
      username: user.username,
      password: '', // Never return the actual password
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}