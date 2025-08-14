import { db } from '../db';
import { studentsTable, studentCardsTable } from '../db/schema';
import { type GetStudentByIdInput, type StudentWithCard } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStudentWithCard(input: GetStudentByIdInput): Promise<StudentWithCard | null> {
  try {
    // Query student with their active card using left join
    const results = await db.select()
      .from(studentsTable)
      .leftJoin(
        studentCardsTable,
        eq(studentsTable.id, studentCardsTable.student_id)
      )
      .where(eq(studentsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Get the first result (should be unique by student ID)
    const result = results[0];
    const student = result.students;
    const card = result.student_cards;

    return {
      student: {
        ...student,
        tanggal_lahir: new Date(student.tanggal_lahir),
        created_at: student.created_at,
        updated_at: student.updated_at
      },
      card: card ? {
        ...card,
        masa_berlaku: new Date(card.masa_berlaku),
        created_at: card.created_at,
        updated_at: card.updated_at
      } : null
    };
  } catch (error) {
    console.error('Failed to get student with card:', error);
    throw error;
  }
}