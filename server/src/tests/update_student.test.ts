import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput, type CreateStudentInput } from '../schema';
import { updateStudent } from '../handlers/update_student';
import { eq } from 'drizzle-orm';

// Create a test student first
const createTestStudent = async (): Promise<number> => {
  const testStudentInput: CreateStudentInput = {
    nisn: '1234567890',
    nama_lengkap: 'Test Student',
    jenis_kelamin: 'LAKI_LAKI',
    tempat_lahir: 'Jakarta',
    tanggal_lahir: new Date('2005-01-01'),
    alamat_jalan: 'Jl. Test No. 123',
    alamat_dusun: 'Dusun Test',
    alamat_desa: 'Desa Test',
    alamat_kecamatan: 'Kecamatan Test',
    nomor_hp: '081234567890',
    agama: 'ISLAM',
    jumlah_saudara: 2,
    anak_ke: 1,
    tinggal_bersama: 'ORANG_TUA',
    asal_sekolah: 'SMP Test',
    foto_siswa: null
  };

  const result = await db.insert(studentsTable)
    .values({
      ...testStudentInput,
      tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0] // Convert Date to string for date column
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update student basic information', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      nama_lengkap: 'Updated Student Name',
      nomor_hp: '089876543210'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(studentId);
    expect(result!.nama_lengkap).toEqual('Updated Student Name');
    expect(result!.nomor_hp).toEqual('089876543210');
    expect(result!.nisn).toEqual('1234567890'); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update student address information', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      alamat_jalan: 'Jl. Updated No. 456',
      alamat_dusun: null,
      alamat_desa: 'Desa Updated',
      alamat_kecamatan: 'Kecamatan Updated'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.alamat_jalan).toEqual('Jl. Updated No. 456');
    expect(result!.alamat_dusun).toBeNull();
    expect(result!.alamat_desa).toEqual('Desa Updated');
    expect(result!.alamat_kecamatan).toEqual('Kecamatan Updated');
  });

  it('should update student personal information', async () => {
    const studentId = await createTestStudent();

    const newBirthDate = new Date('2004-06-15');
    const updateInput: UpdateStudentInput = {
      id: studentId,
      jenis_kelamin: 'PEREMPUAN',
      tempat_lahir: 'Bandung',
      tanggal_lahir: newBirthDate,
      agama: 'KRISTEN'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.jenis_kelamin).toEqual('PEREMPUAN');
    expect(result!.tempat_lahir).toEqual('Bandung');
    expect(result!.tanggal_lahir.toDateString()).toEqual(newBirthDate.toDateString());
    expect(result!.agama).toEqual('KRISTEN');
  });

  it('should update student family information', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      jumlah_saudara: 5,
      anak_ke: 3,
      tinggal_bersama: 'WALI'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.jumlah_saudara).toEqual(5);
    expect(result!.anak_ke).toEqual(3);
    expect(result!.tinggal_bersama).toEqual('WALI');
  });

  it('should update student NISN and school information', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      nisn: '9876543210',
      asal_sekolah: 'SMP Updated School',
      foto_siswa: '/uploads/student_photo.jpg'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.nisn).toEqual('9876543210');
    expect(result!.asal_sekolah).toEqual('SMP Updated School');
    expect(result!.foto_siswa).toEqual('/uploads/student_photo.jpg');
  });

  it('should save updated data to database', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      nama_lengkap: 'Database Test Name',
      nomor_hp: '087654321000'
    };

    await updateStudent(updateInput);

    // Verify data was saved to database
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].nama_lengkap).toEqual('Database Test Name');
    expect(students[0].nomor_hp).toEqual('087654321000');
    expect(students[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent student', async () => {
    const updateInput: UpdateStudentInput = {
      id: 99999,
      nama_lengkap: 'Non-existent Student'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeNull();
  });

  it('should handle partial updates correctly', async () => {
    const studentId = await createTestStudent();

    // Update only one field
    const updateInput: UpdateStudentInput = {
      id: studentId,
      nomor_hp: '081111111111'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.nomor_hp).toEqual('081111111111');
    expect(result!.nama_lengkap).toEqual('Test Student'); // Should remain unchanged
    expect(result!.nisn).toEqual('1234567890'); // Should remain unchanged
  });

  it('should update timestamp when updating student', async () => {
    const studentId = await createTestStudent();

    // Get original updated_at timestamp
    const originalStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    const originalUpdatedAt = originalStudent[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateStudentInput = {
      id: studentId,
      nama_lengkap: 'Updated for timestamp test'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
  });

  it('should handle empty update input gracefully', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(studentId);
    expect(result!.nama_lengkap).toEqual('Test Student'); // Should remain unchanged
  });

  it('should handle nullable fields correctly', async () => {
    const studentId = await createTestStudent();

    const updateInput: UpdateStudentInput = {
      id: studentId,
      alamat_dusun: null,
      foto_siswa: null
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.alamat_dusun).toBeNull();
    expect(result!.foto_siswa).toBeNull();
  });
});