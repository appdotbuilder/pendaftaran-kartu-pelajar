import { db } from '../db';
import { studentsTable } from '../db/schema';
import { sql } from 'drizzle-orm';

/**
 * Generates a unique NIS (Nomor Induk Siswa) following the format: YYYY#### 
 * where YYYY is the current year and #### is a 4-digit sequential number
 */
export const generateNIS = async (): Promise<string> => {
  try {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString();
    
    // Find the highest existing NIS for the current year
    const result = await db
      .select({
        maxNis: sql<string>`max(${studentsTable.nis})`.as('max_nis')
      })
      .from(studentsTable)
      .where(sql`${studentsTable.nis} LIKE ${yearPrefix + '%'}`)
      .execute();
    
    let nextSequentialNumber = 1;
    
    if (result[0]?.maxNis) {
      // Extract the sequential part from the highest NIS
      const sequentialPart = result[0].maxNis.substring(4);
      const currentMax = parseInt(sequentialPart, 10);
      nextSequentialNumber = currentMax + 1;
    }
    
    // Format sequential number with leading zeros (4 digits)
    const formattedSequential = nextSequentialNumber.toString().padStart(4, '0');
    
    const newNIS = `${yearPrefix}${formattedSequential}`;
    
    // Verify uniqueness (safety check)
    const existingStudent = await db
      .select({ nis: studentsTable.nis })
      .from(studentsTable)
      .where(sql`${studentsTable.nis} = ${newNIS}`)
      .limit(1)
      .execute();
    
    if (existingStudent.length > 0) {
      throw new Error('Generated NIS already exists');
    }
    
    return newNIS;
  } catch (error) {
    console.error('NIS generation failed:', error);
    throw error;
  }
};