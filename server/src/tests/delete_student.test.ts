import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, studentCardsTable, usersTable } from '../db/schema';
import { type GetStudentByIdInput, type CreateStudentInput, type CreateUserInput, type CreateStudentCardInput } from '../schema';
import { deleteStudent } from '../handlers/delete_student';
import { eq } from 'drizzle-orm';

// Test data
const testUserInput: CreateUserInput = {
  username: 'student123',
  password: 'password123',
  role: 'SISWA'
};

const testStudentInput: CreateStudentInput = {
  nisn: '1234567890',
  nama_lengkap: 'Test Student',
  jenis_kelamin: 'LAKI_LAKI',
  tempat_lahir: 'Jakarta',
  tanggal_lahir: new Date('2005-01-15'),
  alamat_jalan: 'Jl. Test No. 123',
  alamat_dusun: null,
  alamat_desa: 'Desa Test',
  alamat_kecamatan: 'Kec. Test',
  nomor_hp: '081234567890',
  agama: 'ISLAM',
  jumlah_saudara: 2,
  anak_ke: 1,
  tinggal_bersama: 'ORANG_TUA',
  asal_sekolah: 'SD Test',
  foto_siswa: null
};

describe('deleteStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a student successfully', async () => {
    // Create test student
    const studentResult = await db.insert(studentsTable)
      .values({
        nisn: testStudentInput.nisn,
        nama_lengkap: testStudentInput.nama_lengkap,
        jenis_kelamin: testStudentInput.jenis_kelamin,
        tempat_lahir: testStudentInput.tempat_lahir,
        tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0],
        alamat_jalan: testStudentInput.alamat_jalan,
        alamat_dusun: testStudentInput.alamat_dusun,
        alamat_desa: testStudentInput.alamat_desa,
        alamat_kecamatan: testStudentInput.alamat_kecamatan,
        nomor_hp: testStudentInput.nomor_hp,
        agama: testStudentInput.agama,
        jumlah_saudara: testStudentInput.jumlah_saudara,
        anak_ke: testStudentInput.anak_ke,
        tinggal_bersama: testStudentInput.tinggal_bersama,
        asal_sekolah: testStudentInput.asal_sekolah,
        foto_siswa: testStudentInput.foto_siswa
      })
      .returning()
      .execute();

    const student = studentResult[0];
    const input: GetStudentByIdInput = { id: student.id };

    // Delete the student
    const result = await deleteStudent(input);

    expect(result).toBe(true);

    // Verify student is deleted from database
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student.id))
      .execute();

    expect(deletedStudent).toHaveLength(0);
  });

  it('should delete student and associated user account', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        password: testUserInput.password,
        role: testUserInput.role
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test student with user_id
    const studentResult = await db.insert(studentsTable)
      .values({
        ...testStudentInput,
        tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0],
        user_id: user.id
      })
      .returning()
      .execute();

    const student = studentResult[0];
    const input: GetStudentByIdInput = { id: student.id };

    // Delete the student
    const result = await deleteStudent(input);

    expect(result).toBe(true);

    // Verify student is deleted
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student.id))
      .execute();

    expect(deletedStudent).toHaveLength(0);

    // Verify associated user is also deleted
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(deletedUser).toHaveLength(0);
  });

  it('should delete student and associated student cards', async () => {
    // Create test student
    const studentResult = await db.insert(studentsTable)
      .values({
        ...testStudentInput,
        tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const student = studentResult[0];

    // Create test student card
    const cardInput: CreateStudentCardInput = {
      student_id: student.id,
      masa_berlaku: new Date('2025-12-31')
    };

    await db.insert(studentCardsTable)
      .values({
        student_id: cardInput.student_id,
        card_number: `CARD-${student.id}`,
        masa_berlaku: cardInput.masa_berlaku.toISOString().split('T')[0],
        qr_code_data: student.nisn,
        is_active: true
      })
      .execute();

    const input: GetStudentByIdInput = { id: student.id };

    // Delete the student
    const result = await deleteStudent(input);

    expect(result).toBe(true);

    // Verify student is deleted
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student.id))
      .execute();

    expect(deletedStudent).toHaveLength(0);

    // Verify associated student cards are deleted
    const deletedCards = await db.select()
      .from(studentCardsTable)
      .where(eq(studentCardsTable.student_id, student.id))
      .execute();

    expect(deletedCards).toHaveLength(0);
  });

  it('should delete student with user and cards together', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();

    const user = userResult[0];

    // Create student with user_id
    const studentResult = await db.insert(studentsTable)
      .values({
        ...testStudentInput,
        tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0],
        user_id: user.id
      })
      .returning()
      .execute();

    const student = studentResult[0];

    // Create student card
    await db.insert(studentCardsTable)
      .values({
        student_id: student.id,
        card_number: `CARD-${student.id}`,
        masa_berlaku: new Date('2025-12-31').toISOString().split('T')[0],
        qr_code_data: student.nisn,
        is_active: true
      })
      .execute();

    const input: GetStudentByIdInput = { id: student.id };

    // Delete the student
    const result = await deleteStudent(input);

    expect(result).toBe(true);

    // Verify all records are deleted
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student.id))
      .execute();

    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    const deletedCards = await db.select()
      .from(studentCardsTable)
      .where(eq(studentCardsTable.student_id, student.id))
      .execute();

    expect(deletedStudent).toHaveLength(0);
    expect(deletedUser).toHaveLength(0);
    expect(deletedCards).toHaveLength(0);
  });

  it('should return false when student does not exist', async () => {
    const input: GetStudentByIdInput = { id: 99999 }; // Non-existent ID

    const result = await deleteStudent(input);

    expect(result).toBe(false);
  });

  it('should handle deletion of student without user_id', async () => {
    // Create student without user_id (null)
    const studentResult = await db.insert(studentsTable)
      .values({
        ...testStudentInput,
        tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0],
        user_id: null // Explicitly set to null
      })
      .returning()
      .execute();

    const student = studentResult[0];
    const input: GetStudentByIdInput = { id: student.id };

    // Delete the student
    const result = await deleteStudent(input);

    expect(result).toBe(true);

    // Verify student is deleted
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student.id))
      .execute();

    expect(deletedStudent).toHaveLength(0);
  });
});