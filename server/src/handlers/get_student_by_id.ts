import { db } from '../db';
import { studentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetStudentByIdInput, type Student } from '../schema';

export const getStudentById = async (input: GetStudentByIdInput): Promise<Student | null> => {
  try {
    const results = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const student = results[0];
    return {
      ...student,
      // Convert date strings to Date objects for consistency with schema
      tanggal_lahir: new Date(student.tanggal_lahir),
      created_at: new Date(student.created_at),
      updated_at: new Date(student.updated_at)
    };
  } catch (error) {
    console.error('Failed to get student by ID:', error);
    throw error;
  }
};