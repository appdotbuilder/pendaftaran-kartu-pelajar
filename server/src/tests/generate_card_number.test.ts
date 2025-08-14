import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentCardsTable, studentsTable } from '../db/schema';
import { generateCardNumber } from '../handlers/generate_card_number';

describe('generateCardNumber', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a card number with correct format', async () => {
    const cardNumber = await generateCardNumber();
    
    // Should follow format: CARD-YYYYMMDD-XXX
    const pattern = /^CARD-\d{8}-\d{3}$/;
    expect(cardNumber).toMatch(pattern);
    
    // Should contain today's date
    const today = new Date();
    const expectedDate = today.toISOString().slice(0, 10).replace(/-/g, '');
    expect(cardNumber).toContain(expectedDate);
    
    // Should start with 001 for first card of the day
    expect(cardNumber).toMatch(/-001$/);
  });

  it('should generate sequential numbers for same day', async () => {
    // Create a test student first
    const studentResult = await db.insert(studentsTable)
      .values({
        nisn: '1234567890',
        nama_lengkap: 'Test Student',
        jenis_kelamin: 'LAKI_LAKI',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2005-01-01',
        alamat_jalan: 'Jalan Test',
        alamat_desa: 'Desa Test',
        alamat_kecamatan: 'Kecamatan Test',
        nomor_hp: '08123456789',
        agama: 'ISLAM',
        jumlah_saudara: 2,
        anak_ke: 1,
        tinggal_bersama: 'ORANG_TUA',
        asal_sekolah: 'SD Test'
      })
      .returning()
      .execute();

    const student = studentResult[0];

    // Generate first card number
    const firstCardNumber = await generateCardNumber();
    
    // Insert first card into database
    await db.insert(studentCardsTable)
      .values({
        student_id: student.id,
        card_number: firstCardNumber,
        masa_berlaku: '2025-12-31',
        qr_code_data: student.nisn
      })
      .execute();

    // Generate second card number
    const secondCardNumber = await generateCardNumber();
    
    // Should be sequential
    expect(firstCardNumber).toMatch(/-001$/);
    expect(secondCardNumber).toMatch(/-002$/);
    
    // Both should have same date prefix
    const datePrefix = firstCardNumber.substring(0, 13); // CARD-YYYYMMDD
    expect(secondCardNumber).toStartWith(datePrefix);
  });

  it('should handle multiple existing cards correctly', async () => {
    // Create a test student
    const studentResult = await db.insert(studentsTable)
      .values({
        nisn: '1234567890',
        nama_lengkap: 'Test Student',
        jenis_kelamin: 'LAKI_LAKI',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2005-01-01',
        alamat_jalan: 'Jalan Test',
        alamat_desa: 'Desa Test',
        alamat_kecamatan: 'Kecamatan Test',
        nomor_hp: '08123456789',
        agama: 'ISLAM',
        jumlah_saudara: 2,
        anak_ke: 1,
        tinggal_bersama: 'ORANG_TUA',
        asal_sekolah: 'SD Test'
      })
      .returning()
      .execute();

    const student = studentResult[0];
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Insert several existing cards
    const existingCards = [
      `CARD-${dateStr}-001`,
      `CARD-${dateStr}-002`,
      `CARD-${dateStr}-005` // Non-sequential to test max finding
    ];

    for (const cardNumber of existingCards) {
      await db.insert(studentCardsTable)
        .values({
          student_id: student.id,
          card_number: cardNumber,
          masa_berlaku: '2025-12-31',
          qr_code_data: student.nisn
        })
        .execute();
    }

    // Generate new card number
    const newCardNumber = await generateCardNumber();
    
    // Should be 006 (max + 1)
    expect(newCardNumber).toMatch(/-006$/);
    expect(newCardNumber).toStartWith(`CARD-${dateStr}`);
  });

  it('should not be affected by cards from different dates', async () => {
    // Create a test student
    const studentResult = await db.insert(studentsTable)
      .values({
        nisn: '1234567890',
        nama_lengkap: 'Test Student',
        jenis_kelamin: 'LAKI_LAKI',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2005-01-01',
        alamat_jalan: 'Jalan Test',
        alamat_desa: 'Desa Test',
        alamat_kecamatan: 'Kecamatan Test',
        nomor_hp: '08123456789',
        agama: 'ISLAM',
        jumlah_saudara: 2,
        anak_ke: 1,
        tinggal_bersama: 'ORANG_TUA',
        asal_sekolah: 'SD Test'
      })
      .returning()
      .execute();

    const student = studentResult[0];

    // Insert cards from different dates
    const yesterdayCards = [
      'CARD-20231201-001',
      'CARD-20231201-002',
      'CARD-20230101-999'
    ];

    for (const cardNumber of yesterdayCards) {
      await db.insert(studentCardsTable)
        .values({
          student_id: student.id,
          card_number: cardNumber,
          masa_berlaku: '2025-12-31',
          qr_code_data: student.nisn
        })
        .execute();
    }

    // Generate new card number for today
    const newCardNumber = await generateCardNumber();
    
    // Should start with 001 since no cards exist for today
    expect(newCardNumber).toMatch(/-001$/);
    
    // Should contain today's date, not yesterday's
    const today = new Date();
    const expectedDate = today.toISOString().slice(0, 10).replace(/-/g, '');
    expect(newCardNumber).toStartWith(`CARD-${expectedDate}`);
  });

  it('should handle edge case with gaps in sequential numbers', async () => {
    // Create a test student
    const studentResult = await db.insert(studentsTable)
      .values({
        nisn: '1234567890',
        nama_lengkap: 'Test Student',
        jenis_kelamin: 'LAKI_LAKI',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2005-01-01',
        alamat_jalan: 'Jalan Test',
        alamat_desa: 'Desa Test',
        alamat_kecamatan: 'Kecamatan Test',
        nomor_hp: '08123456789',
        agama: 'ISLAM',
        jumlah_saudara: 2,
        anak_ke: 1,
        tinggal_bersama: 'ORANG_TUA',
        asal_sekolah: 'SD Test'
      })
      .returning()
      .execute();

    const student = studentResult[0];
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Insert cards with gaps: 001, 003, 007
    const existingCards = [
      `CARD-${dateStr}-001`,
      `CARD-${dateStr}-003`,
      `CARD-${dateStr}-007`
    ];

    for (const cardNumber of existingCards) {
      await db.insert(studentCardsTable)
        .values({
          student_id: student.id,
          card_number: cardNumber,
          masa_berlaku: '2025-12-31',
          qr_code_data: student.nisn
        })
        .execute();
    }

    // Generate new card number
    const newCardNumber = await generateCardNumber();
    
    // Should be 008 (max + 1, not filling gaps)
    expect(newCardNumber).toMatch(/-008$/);
  });
});