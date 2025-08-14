import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, studentCardsTable } from '../db/schema';
import { type GetStudentByIdInput } from '../schema';
import { getStudentWithCard } from '../handlers/get_student_with_card';

// Test input for getting student by ID
const testInput: GetStudentByIdInput = {
  id: 1
};

// Test student data
const testStudentData = {
  nisn: '1234567890',
  nama_lengkap: 'John Doe',
  jenis_kelamin: 'LAKI_LAKI' as const,
  tempat_lahir: 'Jakarta',
  tanggal_lahir: '2005-01-15',
  alamat_jalan: 'Jl. Test No. 123',
  alamat_dusun: 'Dusun Test',
  alamat_desa: 'Desa Test',
  alamat_kecamatan: 'Kecamatan Test',
  nomor_hp: '08123456789',
  agama: 'ISLAM' as const,
  jumlah_saudara: 2,
  anak_ke: 1,
  tinggal_bersama: 'ORANG_TUA' as const,
  asal_sekolah: 'SD Test',
  foto_siswa: '/uploads/student1.jpg'
};

// Test card data
const testCardData = {
  student_id: 1,
  card_number: 'CARD001',
  masa_berlaku: '2025-12-31',
  qr_code_data: '1234567890',
  is_active: true
};

describe('getStudentWithCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent student', async () => {
    const result = await getStudentWithCard({ id: 999 });
    expect(result).toBeNull();
  });

  it('should return student with null card when student has no card', async () => {
    // Create student without card
    const studentResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    const result = await getStudentWithCard(testInput);

    expect(result).not.toBeNull();
    expect(result!.student).toBeDefined();
    expect(result!.student.id).toEqual(studentResult[0].id);
    expect(result!.student.nisn).toEqual('1234567890');
    expect(result!.student.nama_lengkap).toEqual('John Doe');
    expect(result!.student.jenis_kelamin).toEqual('LAKI_LAKI');
    expect(result!.student.tempat_lahir).toEqual('Jakarta');
    expect(result!.student.tanggal_lahir).toBeInstanceOf(Date);
    expect(result!.student.alamat_jalan).toEqual('Jl. Test No. 123');
    expect(result!.student.alamat_dusun).toEqual('Dusun Test');
    expect(result!.student.alamat_desa).toEqual('Desa Test');
    expect(result!.student.alamat_kecamatan).toEqual('Kecamatan Test');
    expect(result!.student.nomor_hp).toEqual('08123456789');
    expect(result!.student.agama).toEqual('ISLAM');
    expect(result!.student.jumlah_saudara).toEqual(2);
    expect(result!.student.anak_ke).toEqual(1);
    expect(result!.student.tinggal_bersama).toEqual('ORANG_TUA');
    expect(result!.student.asal_sekolah).toEqual('SD Test');
    expect(result!.student.foto_siswa).toEqual('/uploads/student1.jpg');
    expect(result!.student.created_at).toBeInstanceOf(Date);
    expect(result!.student.updated_at).toBeInstanceOf(Date);
    expect(result!.card).toBeNull();
  });

  it('should return student with card data when both exist', async () => {
    // Create student first
    const studentResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    // Create card for student
    const cardResult = await db.insert(studentCardsTable)
      .values({
        ...testCardData,
        student_id: studentResult[0].id
      })
      .returning()
      .execute();

    const result = await getStudentWithCard({ id: studentResult[0].id });

    expect(result).not.toBeNull();
    
    // Verify student data
    expect(result!.student).toBeDefined();
    expect(result!.student.id).toEqual(studentResult[0].id);
    expect(result!.student.nisn).toEqual('1234567890');
    expect(result!.student.nama_lengkap).toEqual('John Doe');
    expect(result!.student.tanggal_lahir).toBeInstanceOf(Date);
    expect(result!.student.created_at).toBeInstanceOf(Date);
    expect(result!.student.updated_at).toBeInstanceOf(Date);

    // Verify card data
    expect(result!.card).not.toBeNull();
    expect(result!.card!.id).toEqual(cardResult[0].id);
    expect(result!.card!.student_id).toEqual(studentResult[0].id);
    expect(result!.card!.card_number).toEqual('CARD001');
    expect(result!.card!.masa_berlaku).toBeInstanceOf(Date);
    expect(result!.card!.qr_code_data).toEqual('1234567890');
    expect(result!.card!.is_active).toEqual(true);
    expect(result!.card!.created_at).toBeInstanceOf(Date);
    expect(result!.card!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple cards and return the first one found', async () => {
    // Create student
    const studentResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();

    // Create multiple cards for the same student
    await db.insert(studentCardsTable)
      .values([
        {
          ...testCardData,
          student_id: studentResult[0].id,
          card_number: 'CARD001'
        },
        {
          ...testCardData,
          student_id: studentResult[0].id,
          card_number: 'CARD002',
          is_active: false
        }
      ])
      .execute();

    const result = await getStudentWithCard({ id: studentResult[0].id });

    expect(result).not.toBeNull();
    expect(result!.student.id).toEqual(studentResult[0].id);
    expect(result!.card).not.toBeNull();
    // Should return one of the cards (first found)
    expect(['CARD001', 'CARD002']).toContain(result!.card!.card_number);
  });

  it('should handle student with nullable fields correctly', async () => {
    // Create student with minimal required data (nullable fields as null)
    const minimalStudentData = {
      nisn: '9876543210',
      nama_lengkap: 'Jane Doe',
      jenis_kelamin: 'PEREMPUAN' as const,
      tempat_lahir: 'Bandung',
      tanggal_lahir: '2006-05-20',
      alamat_jalan: 'Jl. Minimal',
      alamat_dusun: null, // nullable
      alamat_desa: 'Desa Minimal',
      alamat_kecamatan: 'Kecamatan Minimal',
      nomor_hp: '08987654321',
      agama: 'KRISTEN' as const,
      jumlah_saudara: 0,
      anak_ke: 1,
      tinggal_bersama: 'WALI' as const,
      asal_sekolah: 'SD Minimal',
      foto_siswa: null, // nullable
      user_id: null, // nullable
      nis: null // nullable
    };

    const studentResult = await db.insert(studentsTable)
      .values(minimalStudentData)
      .returning()
      .execute();

    const result = await getStudentWithCard({ id: studentResult[0].id });

    expect(result).not.toBeNull();
    expect(result!.student.nisn).toEqual('9876543210');
    expect(result!.student.nama_lengkap).toEqual('Jane Doe');
    expect(result!.student.alamat_dusun).toBeNull();
    expect(result!.student.foto_siswa).toBeNull();
    expect(result!.student.user_id).toBeNull();
    expect(result!.student.nis).toBeNull();
    expect(result!.card).toBeNull();
  });
});