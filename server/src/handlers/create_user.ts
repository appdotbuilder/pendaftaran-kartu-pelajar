import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash password before storing (using basic hash - in production use bcrypt)
    const hashedPassword = await Bun.password.hash(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        password: hashedPassword,
        role: input.role
      })
      .returning()
      .execute();

    const user = result[0];
    return {
      ...user,
      // Return created_at and updated_at as Date objects
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};