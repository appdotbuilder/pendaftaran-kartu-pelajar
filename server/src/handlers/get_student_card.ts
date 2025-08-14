import { db } from '../db';
import { studentCardsTable, studentsTable } from '../db/schema';
import { type GetStudentByIdInput, type StudentCard } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getStudentCard(input: GetStudentByIdInput): Promise<StudentCard | null> {
  try {
    // First verify that the student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    if (student.length === 0) {
      return null;
    }

    // Fetch the active student card for the given student
    const result = await db.select()
      .from(studentCardsTable)
      .where(
        and(
          eq(studentCardsTable.student_id, input.id),
          eq(studentCardsTable.is_active, true)
        )
      )
      .execute();

    if (result.length === 0) {
      return null;
    }

    const card = result[0];
    return {
      id: card.id,
      student_id: card.student_id,
      card_number: card.card_number,
      masa_berlaku: new Date(card.masa_berlaku),
      qr_code_data: card.qr_code_data,
      is_active: card.is_active,
      created_at: card.created_at,
      updated_at: card.updated_at
    };
  } catch (error) {
    console.error('Student card retrieval failed:', error);
    throw error;
  }
}