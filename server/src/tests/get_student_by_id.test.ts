import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type GetStudentByIdInput } from '../schema';
import { getStudentById } from '../handlers/get_student_by_id';

describe('getStudentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testStudentData = {
    nisn: '1234567890',
    nis: 'S001',
    nama_lengkap: 'Ahmad Sutanto',
    jenis_kelamin: 'LAKI_LAKI' as const,
    tempat_lahir: 'Jakarta',
    tanggal_lahir: '2005-01-15',
    alamat_jalan: 'Jl. Merdeka No. 123',
    alamat_dusun: 'Dusun 1',
    alamat_desa: 'Desa Sukamaju',
    alamat_kecamatan: 'Kecamatan Tengah',
    nomor_hp: '081234567890',
    agama: 'ISLAM' as const,
    jumlah_saudara: 2,
    anak_ke: 1,
    tinggal_bersama: 'ORANG_TUA' as const,
    asal_sekolah: 'SMP Negeri 1 Jakarta',
    foto_siswa: '/uploads/photos/ahmad.jpg',
    user_id: null
  };

  it('should return student when found', async () => {
    // Create test student
    const insertResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    const createdStudent = insertResult[0];

    const input: GetStudentByIdInput = {
      id: createdStudent.id
    };

    const result = await getStudentById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdStudent.id);
    expect(result!.nisn).toEqual('1234567890');
    expect(result!.nama_lengkap).toEqual('Ahmad Sutanto');
    expect(result!.jenis_kelamin).toEqual('LAKI_LAKI');
    expect(result!.tempat_lahir).toEqual('Jakarta');
    expect(result!.tanggal_lahir).toBeInstanceOf(Date);
    expect(result!.tanggal_lahir.toISOString().substring(0, 10)).toEqual('2005-01-15');
    expect(result!.alamat_jalan).toEqual('Jl. Merdeka No. 123');
    expect(result!.alamat_dusun).toEqual('Dusun 1');
    expect(result!.alamat_desa).toEqual('Desa Sukamaju');
    expect(result!.alamat_kecamatan).toEqual('Kecamatan Tengah');
    expect(result!.nomor_hp).toEqual('081234567890');
    expect(result!.agama).toEqual('ISLAM');
    expect(result!.jumlah_saudara).toEqual(2);
    expect(result!.anak_ke).toEqual(1);
    expect(result!.tinggal_bersama).toEqual('ORANG_TUA');
    expect(result!.asal_sekolah).toEqual('SMP Negeri 1 Jakarta');
    expect(result!.foto_siswa).toEqual('/uploads/photos/ahmad.jpg');
    expect(result!.user_id).toBeNull();
    expect(result!.nis).toEqual('S001');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when student not found', async () => {
    const input: GetStudentByIdInput = {
      id: 99999 // Non-existent ID
    };

    const result = await getStudentById(input);

    expect(result).toBeNull();
  });

  it('should handle student with minimal data (nullable fields)', async () => {
    const minimalStudentData = {
      nisn: '0987654321',
      nis: null,
      nama_lengkap: 'Siti Nurhaliza',
      jenis_kelamin: 'PEREMPUAN' as const,
      tempat_lahir: 'Bandung',
      tanggal_lahir: '2006-03-22',
      alamat_jalan: 'Jl. Sudirman No. 456',
      alamat_dusun: null, // Nullable field
      alamat_desa: 'Desa Makmur',
      alamat_kecamatan: 'Kecamatan Utara',
      nomor_hp: '087654321098',
      agama: 'ISLAM' as const,
      jumlah_saudara: 0,
      anak_ke: 1,
      tinggal_bersama: 'ASRAMA' as const,
      asal_sekolah: 'SMP Swasta Bandung',
      foto_siswa: null, // Nullable field
      user_id: null
    };

    const insertResult = await db.insert(studentsTable)
      .values(minimalStudentData)
      .returning()
      .execute();

    const createdStudent = insertResult[0];

    const input: GetStudentByIdInput = {
      id: createdStudent.id
    };

    const result = await getStudentById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdStudent.id);
    expect(result!.nisn).toEqual('0987654321');
    expect(result!.nama_lengkap).toEqual('Siti Nurhaliza');
    expect(result!.alamat_dusun).toBeNull();
    expect(result!.foto_siswa).toBeNull();
    expect(result!.nis).toBeNull();
    expect(result!.jenis_kelamin).toEqual('PEREMPUAN');
    expect(result!.tinggal_bersama).toEqual('ASRAMA');
    expect(result!.jumlah_saudara).toEqual(0);
  });

  it('should return correct data types for all fields', async () => {
    const insertResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    const createdStudent = insertResult[0];

    const input: GetStudentByIdInput = {
      id: createdStudent.id
    };

    const result = await getStudentById(input);

    expect(result).not.toBeNull();
    
    // Type validation
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.nisn).toBe('string');
    expect(typeof result!.nama_lengkap).toBe('string');
    expect(typeof result!.jenis_kelamin).toBe('string');
    expect(typeof result!.tempat_lahir).toBe('string');
    expect(result!.tanggal_lahir).toBeInstanceOf(Date);
    expect(typeof result!.alamat_jalan).toBe('string');
    expect(typeof result!.alamat_desa).toBe('string');
    expect(typeof result!.alamat_kecamatan).toBe('string');
    expect(typeof result!.nomor_hp).toBe('string');
    expect(typeof result!.agama).toBe('string');
    expect(typeof result!.jumlah_saudara).toBe('number');
    expect(typeof result!.anak_ke).toBe('number');
    expect(typeof result!.tinggal_bersama).toBe('string');
    expect(typeof result!.asal_sekolah).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle database queries correctly with multiple students', async () => {
    // Create multiple students to ensure we get the right one
    const student1Data = { ...testStudentData, nisn: '1111111111', nama_lengkap: 'Student One' };
    const student2Data = { ...testStudentData, nisn: '2222222222', nama_lengkap: 'Student Two' };
    const student3Data = { ...testStudentData, nisn: '3333333333', nama_lengkap: 'Student Three' };

    const insertResult = await db.insert(studentsTable)
      .values([student1Data, student2Data, student3Data])
      .returning()
      .execute();

    const targetStudent = insertResult[1]; // Get the second student

    const input: GetStudentByIdInput = {
      id: targetStudent.id
    };

    const result = await getStudentById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetStudent.id);
    expect(result!.nisn).toEqual('2222222222');
    expect(result!.nama_lengkap).toEqual('Student Two');
    
    // Ensure we didn't get data from other students
    expect(result!.nama_lengkap).not.toEqual('Student One');
    expect(result!.nama_lengkap).not.toEqual('Student Three');
  });
});