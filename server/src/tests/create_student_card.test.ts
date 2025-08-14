import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, studentCardsTable, usersTable } from '../db/schema';
import { type CreateStudentCardInput } from '../schema';
import { createStudentCard } from '../handlers/create_student_card';
import { eq } from 'drizzle-orm';

describe('createStudentCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student card with generated card number and NISN as QR data', async () => {
    // Create prerequisite student record
    const studentResult = await db.insert(studentsTable)
      .values({
        nisn: '1234567890',
        nama_lengkap: 'Test Student',
        jenis_kelamin: 'LAKI_LAKI',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2005-01-15',
        alamat_jalan: 'Jl. Test No. 1',
        alamat_dusun: null,
        alamat_desa: 'Test Village',
        alamat_kecamatan: 'Test District',
        nomor_hp: '081234567890',
        agama: 'ISLAM',
        jumlah_saudara: 2,
        anak_ke: 1,
        tinggal_bersama: 'ORANG_TUA',
        asal_sekolah: 'SMP Test',
        foto_siswa: null
      })
      .returning()
      .execute();

    const student = studentResult[0];

    const testInput: CreateStudentCardInput = {
      student_id: student.id,
      masa_berlaku: new Date('2025-12-31')
    };

    const result = await createStudentCard(testInput);

    // Basic field validation
    expect(result.student_id).toEqual(student.id);
    expect(result.masa_berlaku).toEqual(new Date('2025-12-31'));
    expect(result.qr_code_data).toEqual('1234567890'); // Should be student's NISN
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Card number should follow pattern CARD-timestamp-randomsuffix
    expect(result.card_number).toMatch(/^CARD-\d{13}-\d{3}$/);
  });

  it('should save student card to database', async () => {
    // Create prerequisite student record
    const studentResult = await db.insert(studentsTable)
      .values({
        nisn: '9876543210',
        nama_lengkap: 'Another Test Student',
        jenis_kelamin: 'PEREMPUAN',
        tempat_lahir: 'Bandung',
        tanggal_lahir: '2006-05-20',
        alamat_jalan: 'Jl. Another Test No. 2',
        alamat_dusun: 'Test Hamlet',
        alamat_desa: 'Another Village',
        alamat_kecamatan: 'Another District',
        nomor_hp: '087654321098',
        agama: 'KRISTEN',
        jumlah_saudara: 1,
        anak_ke: 2,
        tinggal_bersama: 'WALI',
        asal_sekolah: 'SMP Another',
        foto_siswa: 'path/to/photo.jpg'
      })
      .returning()
      .execute();

    const student = studentResult[0];

    const testInput: CreateStudentCardInput = {
      student_id: student.id,
      masa_berlaku: new Date('2024-06-30')
    };

    const result = await createStudentCard(testInput);

    // Query database to verify card was saved
    const cards = await db.select()
      .from(studentCardsTable)
      .where(eq(studentCardsTable.id, result.id))
      .execute();

    expect(cards).toHaveLength(1);
    const savedCard = cards[0];
    expect(savedCard.student_id).toEqual(student.id);
    expect(new Date(savedCard.masa_berlaku)).toEqual(new Date('2024-06-30'));
    expect(savedCard.qr_code_data).toEqual('9876543210');
    expect(savedCard.is_active).toEqual(true);
    expect(savedCard.created_at).toBeInstanceOf(Date);
    expect(savedCard.card_number).toMatch(/^CARD-\d{13}-\d{3}$/);
  });

  it('should generate unique card numbers for different cards', async () => {
    // Create two students
    const student1Result = await db.insert(studentsTable)
      .values({
        nisn: '1111111111',
        nama_lengkap: 'Student One',
        jenis_kelamin: 'LAKI_LAKI',
        tempat_lahir: 'City A',
        tanggal_lahir: '2005-01-01',
        alamat_jalan: 'Street 1',
        alamat_dusun: null,
        alamat_desa: 'Village A',
        alamat_kecamatan: 'District A',
        nomor_hp: '081111111111',
        agama: 'ISLAM',
        jumlah_saudara: 0,
        anak_ke: 1,
        tinggal_bersama: 'ORANG_TUA',
        asal_sekolah: 'School A',
        foto_siswa: null
      })
      .returning()
      .execute();

    const student2Result = await db.insert(studentsTable)
      .values({
        nisn: '2222222222',
        nama_lengkap: 'Student Two',
        jenis_kelamin: 'PEREMPUAN',
        tempat_lahir: 'City B',
        tanggal_lahir: '2005-02-02',
        alamat_jalan: 'Street 2',
        alamat_dusun: 'Hamlet B',
        alamat_desa: 'Village B',
        alamat_kecamatan: 'District B',
        nomor_hp: '082222222222',
        agama: 'KATOLIK',
        jumlah_saudara: 3,
        anak_ke: 2,
        tinggal_bersama: 'ASRAMA',
        asal_sekolah: 'School B',
        foto_siswa: null
      })
      .returning()
      .execute();

    // Create cards for both students
    const card1 = await createStudentCard({
      student_id: student1Result[0].id,
      masa_berlaku: new Date('2025-01-01')
    });

    const card2 = await createStudentCard({
      student_id: student2Result[0].id,
      masa_berlaku: new Date('2025-02-02')
    });

    // Card numbers should be different
    expect(card1.card_number).not.toEqual(card2.card_number);
    expect(card1.qr_code_data).toEqual('1111111111');
    expect(card2.qr_code_data).toEqual('2222222222');
  });

  it('should throw error when student does not exist', async () => {
    const testInput: CreateStudentCardInput = {
      student_id: 99999, // Non-existent student ID
      masa_berlaku: new Date('2025-12-31')
    };

    await expect(createStudentCard(testInput)).rejects.toThrow(/Student with ID 99999 not found/i);
  });

  it('should handle student with linked user account', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teststudent',
        password: 'hashedpassword123',
        role: 'SISWA'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create student linked to user
    const studentResult = await db.insert(studentsTable)
      .values({
        nisn: '5555555555',
        nama_lengkap: 'Student With Account',
        jenis_kelamin: 'LAKI_LAKI',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2005-03-15',
        alamat_jalan: 'Jl. Linked No. 5',
        alamat_dusun: null,
        alamat_desa: 'Linked Village',
        alamat_kecamatan: 'Linked District',
        nomor_hp: '085555555555',
        agama: 'BUDDHA',
        jumlah_saudara: 1,
        anak_ke: 1,
        tinggal_bersama: 'KOST',
        asal_sekolah: 'SMP Linked',
        foto_siswa: 'student5.jpg',
        user_id: user.id // Link to user account
      })
      .returning()
      .execute();

    const student = studentResult[0];

    const testInput: CreateStudentCardInput = {
      student_id: student.id,
      masa_berlaku: new Date('2025-08-15')
    };

    const result = await createStudentCard(testInput);

    expect(result.student_id).toEqual(student.id);
    expect(result.qr_code_data).toEqual('5555555555');
    expect(result.is_active).toEqual(true);
    expect(result.card_number).toMatch(/^CARD-\d{13}-\d{3}$/);
  });
});