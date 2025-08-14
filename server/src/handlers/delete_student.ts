import { db } from '../db';
import { studentsTable, studentCardsTable, usersTable } from '../db/schema';
import { type GetStudentByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteStudent(input: GetStudentByIdInput): Promise<boolean> {
  try {
    // First, check if the student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    if (student.length === 0) {
      return false; // Student doesn't exist
    }

    const studentRecord = student[0];

    // Delete associated student cards first (foreign key constraint)
    await db.delete(studentCardsTable)
      .where(eq(studentCardsTable.student_id, input.id))
      .execute();

    // Delete the student record first to remove foreign key reference
    const deleteResult = await db.delete(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    // Delete associated user account if exists (after student is deleted)
    if (studentRecord.user_id) {
      await db.delete(usersTable)
        .where(eq(usersTable.id, studentRecord.user_id))
        .execute();
    }

    return deleteResult.rowCount !== undefined && deleteResult.rowCount !== null && deleteResult.rowCount > 0;
  } catch (error) {
    console.error('Student deletion failed:', error);
    throw error;
  }
}