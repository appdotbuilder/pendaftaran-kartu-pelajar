import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type GetStudentsByFilterInput, type Student } from '../schema';
import { and, ilike, SQL } from 'drizzle-orm';

export const getStudents = async (input: GetStudentsByFilterInput): Promise<Student[]> => {
  try {
    // Collect filter conditions
    const conditions: SQL<unknown>[] = [];

    if (input.nisn) {
      conditions.push(ilike(studentsTable.nisn, `%${input.nisn}%`));
    }

    if (input.nama_lengkap) {
      conditions.push(ilike(studentsTable.nama_lengkap, `%${input.nama_lengkap}%`));
    }

    // Build and execute the query with all conditions at once
    const results = conditions.length > 0
      ? await db.select()
          .from(studentsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .limit(input.limit)
          .offset(input.offset)
          .execute()
      : await db.select()
          .from(studentsTable)
          .limit(input.limit)
          .offset(input.offset)
          .execute();

    // Convert date fields to proper Date objects and return
    return results.map(student => ({
      ...student,
      tanggal_lahir: new Date(student.tanggal_lahir),
      created_at: new Date(student.created_at),
      updated_at: new Date(student.updated_at)
    }));
  } catch (error) {
    console.error('Failed to get students:', error);
    throw error;
  }
};