import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, studentCardsTable } from '../db/schema';
import { type GetStudentByIdInput } from '../schema';
import { getStudentCard } from '../handlers/get_student_card';

// Test data
const testStudentData = {
  nisn: '1234567890',
  nama_lengkap: 'Test Student',
  jenis_kelamin: 'LAKI_LAKI' as const,
  tempat_lahir: 'Jakarta',
  tanggal_lahir: '2000-01-01',
  alamat_jalan: 'Jl. Test No. 1',
  alamat_dusun: 'Dusun Test',
  alamat_desa: 'Desa Test',
  alamat_kecamatan: 'Kecamatan Test',
  nomor_hp: '08123456789',
  agama: 'ISLAM' as const,
  jumlah_saudara: 2,
  anak_ke: 1,
  tinggal_bersama: 'ORANG_TUA' as const,
  asal_sekolah: 'SMP Test'
};

describe('getStudentCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active student card for existing student', async () => {
    // Create a student first
    const studentResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    const student = studentResult[0];

    // Create an active student card
    const cardResult = await db.insert(studentCardsTable)
      .values({
        student_id: student.id,
        card_number: 'CARD-001',
        masa_berlaku: '2025-12-31',
        qr_code_data: testStudentData.nisn,
        is_active: true
      })
      .returning()
      .execute();

    const expectedCard = cardResult[0];

    // Test the handler
    const input: GetStudentByIdInput = { id: student.id };
    const result = await getStudentCard(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(expectedCard.id);
    expect(result!.student_id).toEqual(student.id);
    expect(result!.card_number).toEqual('CARD-001');
    expect(result!.masa_berlaku).toEqual(new Date('2025-12-31'));
    expect(result!.qr_code_data).toEqual(testStudentData.nisn);
    expect(result!.is_active).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent student', async () => {
    const input: GetStudentByIdInput = { id: 99999 };
    const result = await getStudentCard(input);

    expect(result).toBeNull();
  });

  it('should return null for student without card', async () => {
    // Create a student without card
    const studentResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    const student = studentResult[0];

    // Test the handler
    const input: GetStudentByIdInput = { id: student.id };
    const result = await getStudentCard(input);

    expect(result).toBeNull();
  });

  it('should return null for student with only inactive cards', async () => {
    // Create a student
    const studentResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    const student = studentResult[0];

    // Create inactive student cards
    await db.insert(studentCardsTable)
      .values([
        {
          student_id: student.id,
          card_number: 'CARD-INACTIVE-1',
          masa_berlaku: '2025-12-31',
          qr_code_data: testStudentData.nisn,
          is_active: false
        },
        {
          student_id: student.id,
          card_number: 'CARD-INACTIVE-2',
          masa_berlaku: '2025-12-31',
          qr_code_data: testStudentData.nisn,
          is_active: false
        }
      ])
      .execute();

    // Test the handler
    const input: GetStudentByIdInput = { id: student.id };
    const result = await getStudentCard(input);

    expect(result).toBeNull();
  });

  it('should return only active card when both active and inactive cards exist', async () => {
    // Create a student
    const studentResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    const student = studentResult[0];

    // Create both active and inactive cards
    await db.insert(studentCardsTable)
      .values([
        {
          student_id: student.id,
          card_number: 'CARD-INACTIVE',
          masa_berlaku: '2024-12-31',
          qr_code_data: testStudentData.nisn,
          is_active: false
        }
      ])
      .execute();

    const activeCardResult = await db.insert(studentCardsTable)
      .values({
        student_id: student.id,
        card_number: 'CARD-ACTIVE',
        masa_berlaku: '2025-12-31',
        qr_code_data: testStudentData.nisn,
        is_active: true
      })
      .returning()
      .execute();

    const activeCard = activeCardResult[0];

    // Test the handler
    const input: GetStudentByIdInput = { id: student.id };
    const result = await getStudentCard(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(activeCard.id);
    expect(result!.card_number).toEqual('CARD-ACTIVE');
    expect(result!.is_active).toBe(true);
  });

  it('should handle expired cards correctly if they are still active', async () => {
    // Create a student
    const studentResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    const student = studentResult[0];

    // Create an expired but still active card
    const expiredDate = '2020-12-31';
    const cardResult = await db.insert(studentCardsTable)
      .values({
        student_id: student.id,
        card_number: 'CARD-EXPIRED',
        masa_berlaku: expiredDate,
        qr_code_data: testStudentData.nisn,
        is_active: true
      })
      .returning()
      .execute();

    const expectedCard = cardResult[0];

    // Test the handler - should still return the card since is_active is true
    const input: GetStudentByIdInput = { id: student.id };
    const result = await getStudentCard(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(expectedCard.id);
    expect(result!.card_number).toEqual('CARD-EXPIRED');
    expect(result!.masa_berlaku).toEqual(new Date(expiredDate));
    expect(result!.is_active).toBe(true);
  });
});