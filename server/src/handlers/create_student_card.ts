import { db } from '../db';
import { studentCardsTable, studentsTable } from '../db/schema';
import { type CreateStudentCardInput, type StudentCard } from '../schema';
import { eq } from 'drizzle-orm';

export const createStudentCard = async (input: CreateStudentCardInput): Promise<StudentCard> => {
  try {
    // First, verify that the student exists and get their NISN
    const student = await db
      .select({ nisn: studentsTable.nisn })
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error(`Student with ID ${input.student_id} not found`);
    }

    const studentNisn = student[0].nisn;

    // Generate unique card number - using timestamp + random suffix
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const cardNumber = `CARD-${timestamp}-${randomSuffix}`;

    // Insert student card record
    const result = await db.insert(studentCardsTable)
      .values({
        student_id: input.student_id,
        card_number: cardNumber,
        masa_berlaku: input.masa_berlaku.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        qr_code_data: studentNisn, // Use student's NISN for QR code
        is_active: true
      })
      .returning()
      .execute();

    // Convert masa_berlaku back to Date object for return
    const card = result[0];
    return {
      ...card,
      masa_berlaku: new Date(card.masa_berlaku) // Convert string back to Date
    };
  } catch (error) {
    console.error('Student card creation failed:', error);
    throw error;
  }
};