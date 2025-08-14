import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { createStudent } from '../handlers/create_student';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateStudentInput = {
  nisn: '1234567890',
  nama_lengkap: 'Ahmad Budi Santoso',
  jenis_kelamin: 'LAKI_LAKI',
  tempat_lahir: 'Jakarta',
  tanggal_lahir: new Date('2005-01-15'),
  alamat_jalan: 'Jl. Merdeka No. 123',
  alamat_dusun: 'Dusun Mawar',
  alamat_desa: 'Desa Sukamaju',
  alamat_kecamatan: 'Kec. Sukabumi',
  nomor_hp: '08123456789',
  agama: 'ISLAM',
  jumlah_saudara: 2,
  anak_ke: 1,
  tinggal_bersama: 'ORANG_TUA',
  asal_sekolah: 'SMP Negeri 1 Jakarta',
  foto_siswa: null
};

// Alternative test input for uniqueness testing
const alternativeInput: CreateStudentInput = {
  nisn: '0987654321',
  nama_lengkap: 'Siti Nur Aisyah',
  jenis_kelamin: 'PEREMPUAN',
  tempat_lahir: 'Bandung',
  tanggal_lahir: new Date('2006-03-20'),
  alamat_jalan: 'Jl. Sudirman No. 456',
  alamat_dusun: null,
  alamat_desa: 'Desa Bahagia',
  alamat_kecamatan: 'Kec. Bandung Barat',
  nomor_hp: '08567891234',
  agama: 'ISLAM',
  jumlah_saudara: 1,
  anak_ke: 2,
  tinggal_bersama: 'WALI',
  asal_sekolah: 'SMP Swasta Harapan',
  foto_siswa: 'https://example.com/photo.jpg'
};

describe('createStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student with all required fields', async () => {
    const result = await createStudent(testInput);

    // Basic field validation
    expect(result.nisn).toEqual('1234567890');
    expect(result.nama_lengkap).toEqual('Ahmad Budi Santoso');
    expect(result.jenis_kelamin).toEqual('LAKI_LAKI');
    expect(result.tempat_lahir).toEqual('Jakarta');
    expect(result.tanggal_lahir).toEqual(new Date('2005-01-15'));
    expect(result.alamat_jalan).toEqual('Jl. Merdeka No. 123');
    expect(result.alamat_dusun).toEqual('Dusun Mawar');
    expect(result.alamat_desa).toEqual('Desa Sukamaju');
    expect(result.alamat_kecamatan).toEqual('Kec. Sukabumi');
    expect(result.nomor_hp).toEqual('08123456789');
    expect(result.agama).toEqual('ISLAM');
    expect(result.jumlah_saudara).toEqual(2);
    expect(result.anak_ke).toEqual(1);
    expect(result.tinggal_bersama).toEqual('ORANG_TUA');
    expect(result.asal_sekolah).toEqual('SMP Negeri 1 Jakarta');
    expect(result.foto_siswa).toBeNull();
    expect(result.user_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.nis).toBeDefined();
    expect(typeof result.nis).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should auto-generate NIS with current year format', async () => {
    const result = await createStudent(testInput);
    const currentYear = new Date().getFullYear();
    
    // NIS should start with current year and have 3 digits sequence
    expect(result.nis).toMatch(new RegExp(`^${currentYear}\\d{3}$`));
    expect(result.nis).toEqual(`${currentYear}001`); // First student should be 001
  });

  it('should generate sequential NIS for multiple students', async () => {
    const currentYear = new Date().getFullYear();
    
    const student1 = await createStudent(testInput);
    const student2 = await createStudent(alternativeInput);

    expect(student1.nis).toEqual(`${currentYear}001`);
    expect(student2.nis).toEqual(`${currentYear}002`);
  });

  it('should save student to database', async () => {
    const result = await createStudent(testInput);

    // Query database to verify record was saved
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    const student = students[0];
    expect(student.nisn).toEqual('1234567890');
    expect(student.nama_lengkap).toEqual('Ahmad Budi Santoso');
    expect(student.jenis_kelamin).toEqual('LAKI_LAKI');
    expect(student.nis).toBeDefined();
    expect(student.created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const inputWithNulls: CreateStudentInput = {
      ...testInput,
      alamat_dusun: null,
      foto_siswa: null
    };

    const result = await createStudent(inputWithNulls);

    expect(result.alamat_dusun).toBeNull();
    expect(result.foto_siswa).toBeNull();
    expect(result.user_id).toBeNull();
  });

  it('should throw error when NISN already exists', async () => {
    // Create first student
    await createStudent(testInput);

    // Try to create another student with same NISN
    const duplicateInput = { ...alternativeInput, nisn: testInput.nisn };

    await expect(createStudent(duplicateInput))
      .rejects.toThrow(/Student with NISN.*already exists/i);
  });

  it('should handle all gender enum values', async () => {
    const maleStudent = await createStudent(testInput);
    expect(maleStudent.jenis_kelamin).toEqual('LAKI_LAKI');

    const femaleInput = { ...alternativeInput, nisn: '1111111111' };
    const femaleStudent = await createStudent(femaleInput);
    expect(femaleStudent.jenis_kelamin).toEqual('PEREMPUAN');
  });

  it('should handle all religion enum values', async () => {
    const religions = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU'] as const;
    
    for (let i = 0; i < religions.length; i++) {
      const religionInput = {
        ...testInput,
        nisn: `111111111${i}`, // Unique NISN for each test
        agama: religions[i]
      };
      
      const result = await createStudent(religionInput);
      expect(result.agama).toEqual(religions[i]);
    }
  });

  it('should handle all living_with enum values', async () => {
    const livingOptions = ['ORANG_TUA', 'WALI', 'ASRAMA', 'KOST', 'LAINNYA'] as const;
    
    for (let i = 0; i < livingOptions.length; i++) {
      const livingInput = {
        ...testInput,
        nisn: `222222222${i}`, // Unique NISN for each test
        tinggal_bersama: livingOptions[i]
      };
      
      const result = await createStudent(livingInput);
      expect(result.tinggal_bersama).toEqual(livingOptions[i]);
    }
  });

  it('should validate date fields are properly stored', async () => {
    const result = await createStudent(testInput);
    
    expect(result.tanggal_lahir).toEqual(new Date('2005-01-15'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify dates are saved to database correctly
    const dbRecord = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();
    
    // Database stores date as string, so compare string format
    expect(dbRecord[0].tanggal_lahir).toEqual('2005-01-15');
    expect(dbRecord[0].created_at).toBeInstanceOf(Date);
  });
});