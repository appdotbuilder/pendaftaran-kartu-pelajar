import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type GetStudentsByFilterInput } from '../schema';
import { getStudents } from '../handlers/get_students';

// Test student data for database insertion
const testStudentsForDB = [
  {
    nisn: '1234567890',
    nama_lengkap: 'Ahmad Wijaya',
    jenis_kelamin: 'LAKI_LAKI' as const,
    tempat_lahir: 'Jakarta',
    tanggal_lahir: '2005-06-15',
    alamat_jalan: 'Jl. Merdeka No. 123',
    alamat_dusun: 'Dusun 1',
    alamat_desa: 'Sukamaju',
    alamat_kecamatan: 'Cikarang',
    nomor_hp: '08123456789',
    agama: 'ISLAM' as const,
    jumlah_saudara: 2,
    anak_ke: 1,
    tinggal_bersama: 'ORANG_TUA' as const,
    asal_sekolah: 'SMP Negeri 1 Jakarta',
    foto_siswa: null
  },
  {
    nisn: '0987654321',
    nama_lengkap: 'Siti Nurhaliza',
    jenis_kelamin: 'PEREMPUAN' as const,
    tempat_lahir: 'Bandung',
    tanggal_lahir: '2006-03-20',
    alamat_jalan: 'Jl. Sudirman No. 456',
    alamat_dusun: null,
    alamat_desa: 'Sukasari',
    alamat_kecamatan: 'Bekasi',
    nomor_hp: '08198765432',
    agama: 'ISLAM' as const,
    jumlah_saudara: 1,
    anak_ke: 2,
    tinggal_bersama: 'ORANG_TUA' as const,
    asal_sekolah: 'SMP Islam Al-Azhar',
    foto_siswa: 'photos/siti.jpg'
  },
  {
    nisn: '5555666677',
    nama_lengkap: 'Budi Santoso',
    jenis_kelamin: 'LAKI_LAKI' as const,
    tempat_lahir: 'Surabaya',
    tanggal_lahir: '2005-12-10',
    alamat_jalan: 'Jl. Pemuda No. 789',
    alamat_dusun: 'Dusun 3',
    alamat_desa: 'Makmur',
    alamat_kecamatan: 'Sidoarjo',
    nomor_hp: '08155556666',
    agama: 'KRISTEN' as const,
    jumlah_saudara: 0,
    anak_ke: 1,
    tinggal_bersama: 'WALI' as const,
    asal_sekolah: 'SMP Kristen Petra',
    foto_siswa: null
  }
];

describe('getStudents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all students with default pagination', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(3);
    expect(results[0].nisn).toEqual('1234567890');
    expect(results[0].nama_lengkap).toEqual('Ahmad Wijaya');
    expect(results[0].tanggal_lahir).toBeInstanceOf(Date);
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter students by NISN', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      nisn: '1234567890',
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(1);
    expect(results[0].nisn).toEqual('1234567890');
    expect(results[0].nama_lengkap).toEqual('Ahmad Wijaya');
  });

  it('should filter students by partial NISN', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      nisn: '123',
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(1);
    expect(results[0].nisn).toEqual('1234567890');
  });

  it('should filter students by name (case insensitive)', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      nama_lengkap: 'siti',
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(1);
    expect(results[0].nama_lengkap).toEqual('Siti Nurhaliza');
  });

  it('should filter students by partial name', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      nama_lengkap: 'Bud',
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(1);
    expect(results[0].nama_lengkap).toEqual('Budi Santoso');
  });

  it('should combine NISN and name filters', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      nisn: '0987',
      nama_lengkap: 'Siti',
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(1);
    expect(results[0].nisn).toEqual('0987654321');
    expect(results[0].nama_lengkap).toEqual('Siti Nurhaliza');
  });

  it('should return empty array when no matches found', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      nisn: '9999999999',
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(0);
  });

  it('should apply pagination with limit', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      limit: 2,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(2);
  });

  it('should apply pagination with offset', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      limit: 2,
      offset: 1
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(2);
    // Should not include the first student
    expect(results.some(s => s.nisn === '1234567890')).toBe(false);
  });

  it('should handle empty database', async () => {
    const input: GetStudentsByFilterInput = {
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(0);
  });

  it('should preserve all student fields', async () => {
    // Create one test student
    await db.insert(studentsTable).values([testStudentsForDB[0]]).execute();

    const input: GetStudentsByFilterInput = {
      limit: 50,
      offset: 0
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(1);
    const student = results[0];

    // Verify all fields are present
    expect(student.id).toBeDefined();
    expect(student.nisn).toEqual('1234567890');
    expect(student.nis).toBeNull(); // Should be null by default
    expect(student.nama_lengkap).toEqual('Ahmad Wijaya');
    expect(student.jenis_kelamin).toEqual('LAKI_LAKI');
    expect(student.tempat_lahir).toEqual('Jakarta');
    expect(student.tanggal_lahir).toBeInstanceOf(Date);
    expect(student.alamat_jalan).toEqual('Jl. Merdeka No. 123');
    expect(student.alamat_dusun).toEqual('Dusun 1');
    expect(student.alamat_desa).toEqual('Sukamaju');
    expect(student.alamat_kecamatan).toEqual('Cikarang');
    expect(student.nomor_hp).toEqual('08123456789');
    expect(student.agama).toEqual('ISLAM');
    expect(student.jumlah_saudara).toEqual(2);
    expect(student.anak_ke).toEqual(1);
    expect(student.tinggal_bersama).toEqual('ORANG_TUA');
    expect(student.asal_sekolah).toEqual('SMP Negeri 1 Jakarta');
    expect(student.foto_siswa).toBeNull();
    expect(student.user_id).toBeNull(); // Should be null by default
    expect(student.created_at).toBeInstanceOf(Date);
    expect(student.updated_at).toBeInstanceOf(Date);
  });

  it('should handle filters with no results and pagination', async () => {
    // Create test students
    await db.insert(studentsTable).values(testStudentsForDB).execute();

    const input: GetStudentsByFilterInput = {
      nama_lengkap: 'NonExistentName',
      limit: 10,
      offset: 5
    };

    const results = await getStudents(input);

    expect(results).toHaveLength(0);
  });
});