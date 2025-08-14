import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { generateNIS } from '../handlers/generate_nis';
import { eq } from 'drizzle-orm';

// Test student data for creating database entries
const testStudentBase = {
  nisn: '1234567890',
  nama_lengkap: 'Test Student',
  jenis_kelamin: 'LAKI_LAKI' as const,
  tempat_lahir: 'Jakarta',
  tanggal_lahir: '2000-01-01',
  alamat_jalan: 'Jl. Test No. 1',
  alamat_dusun: null,
  alamat_desa: 'Test Village',
  alamat_kecamatan: 'Test District',
  nomor_hp: '08123456789',
  agama: 'ISLAM' as const,
  jumlah_saudara: 2,
  anak_ke: 1,
  tinggal_bersama: 'ORANG_TUA' as const,
  asal_sekolah: 'SD Test',
  foto_siswa: null,
  user_id: null
};

describe('generateNIS', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate first NIS for current year', async () => {
    const result = await generateNIS();
    const currentYear = new Date().getFullYear();
    const expectedPrefix = currentYear.toString();

    expect(result).toMatch(new RegExp(`^${expectedPrefix}\\d{4}$`));
    expect(result).toEqual(`${expectedPrefix}0001`);
    expect(result.length).toEqual(8);
  });

  it('should generate sequential NIS numbers', async () => {
    // Create a student with the first NIS
    const currentYear = new Date().getFullYear();
    const firstNIS = `${currentYear}0001`;
    
    await db.insert(studentsTable).values({
      ...testStudentBase,
      nisn: '1234567891',
      nis: firstNIS
    }).execute();

    // Generate next NIS
    const secondNIS = await generateNIS();
    
    expect(secondNIS).toEqual(`${currentYear}0002`);
    expect(parseInt(secondNIS.substring(4))).toBeGreaterThan(parseInt(firstNIS.substring(4)));
  });

  it('should handle non-consecutive existing NIS numbers', async () => {
    const currentYear = new Date().getFullYear();
    
    // Create students with NIS numbers 0001, 0003, 0005
    await db.insert(studentsTable).values([
      {
        ...testStudentBase,
        nisn: '1234567891',
        nis: `${currentYear}0001`
      },
      {
        ...testStudentBase,
        nisn: '1234567892',
        nis: `${currentYear}0003`
      },
      {
        ...testStudentBase,
        nisn: '1234567893',
        nis: `${currentYear}0005`
      }
    ]).execute();

    // Should generate the next sequential number after the highest (0006)
    const nextNIS = await generateNIS();
    expect(nextNIS).toEqual(`${currentYear}0006`);
  });

  it('should handle NIS numbers from different years', async () => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    // Create students from previous year
    await db.insert(studentsTable).values([
      {
        ...testStudentBase,
        nisn: '1234567891',
        nis: `${previousYear}0010`
      },
      {
        ...testStudentBase,
        nisn: '1234567892',
        nis: `${previousYear}0020`
      }
    ]).execute();

    // Should generate first NIS for current year, ignoring previous year numbers
    const newNIS = await generateNIS();
    expect(newNIS).toEqual(`${currentYear}0001`);
  });

  it('should generate unique NIS when multiple students exist', async () => {
    const currentYear = new Date().getFullYear();
    
    // Create multiple students
    const students = [];
    for (let i = 1; i <= 5; i++) {
      students.push({
        ...testStudentBase,
        nisn: `123456789${i}`,
        nis: `${currentYear}${i.toString().padStart(4, '0')}`
      });
    }
    
    await db.insert(studentsTable).values(students).execute();

    // Generate next NIS
    const nextNIS = await generateNIS();
    expect(nextNIS).toEqual(`${currentYear}0006`);
    
    // Verify uniqueness by checking database
    const existingStudents = await db
      .select({ nis: studentsTable.nis })
      .from(studentsTable)
      .where(eq(studentsTable.nis, nextNIS))
      .execute();
    
    expect(existingStudents).toHaveLength(0);
  });

  it('should handle large sequential numbers correctly', async () => {
    const currentYear = new Date().getFullYear();
    const highNIS = `${currentYear}9999`;
    
    await db.insert(studentsTable).values({
      ...testStudentBase,
      nisn: '1234567891',
      nis: highNIS
    }).execute();

    // Should generate 10000 (5-digit sequential number)
    const nextNIS = await generateNIS();
    expect(nextNIS).toEqual(`${currentYear}10000`);
    expect(nextNIS.length).toEqual(9); // Year (4) + sequential (5)
  });

  it('should verify NIS format correctness', async () => {
    const result = await generateNIS();
    const currentYear = new Date().getFullYear();
    
    // Check format: YYYY followed by digits
    expect(result).toMatch(/^\d{4}\d{4,}$/);
    expect(result.substring(0, 4)).toEqual(currentYear.toString());
    expect(parseInt(result.substring(4))).toBeGreaterThan(0);
  });

  it('should handle empty database correctly', async () => {
    // Database is empty (no students)
    const result = await generateNIS();
    const currentYear = new Date().getFullYear();
    
    expect(result).toEqual(`${currentYear}0001`);
  });
});