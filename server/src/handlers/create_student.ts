import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    // Check if NISN already exists to ensure uniqueness
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.nisn, input.nisn))
      .limit(1)
      .execute();

    if (existingStudent.length > 0) {
      throw new Error(`Student with NISN ${input.nisn} already exists`);
    }

    // Generate NIS (Nomor Induk Siswa) based on year and sequence
    // Format: YYYY + sequence number (e.g., 2024001, 2024002, etc.)
    const currentYear = new Date().getFullYear();
    
    // Get the count of all students to generate sequence number
    const allStudents = await db.select()
      .from(studentsTable)
      .execute();

    const sequence = allStudents.length + 1;
    const nis = `${currentYear}${sequence.toString().padStart(3, '0')}`;

    // Convert date to string format for database storage
    const tanggalLahirString = input.tanggal_lahir.toISOString().split('T')[0];

    // Insert student record
    const result = await db.insert(studentsTable)
      .values({
        nisn: input.nisn,
        nis: nis,
        nama_lengkap: input.nama_lengkap,
        jenis_kelamin: input.jenis_kelamin,
        tempat_lahir: input.tempat_lahir,
        tanggal_lahir: tanggalLahirString,
        alamat_jalan: input.alamat_jalan,
        alamat_dusun: input.alamat_dusun,
        alamat_desa: input.alamat_desa,
        alamat_kecamatan: input.alamat_kecamatan,
        nomor_hp: input.nomor_hp,
        agama: input.agama,
        jumlah_saudara: input.jumlah_saudara,
        anak_ke: input.anak_ke,
        tinggal_bersama: input.tinggal_bersama,
        asal_sekolah: input.asal_sekolah,
        foto_siswa: input.foto_siswa,
        user_id: null // Can be linked later if student needs login access
      })
      .returning()
      .execute();

    // Convert string date back to Date object for return
    const student = result[0];
    return {
      ...student,
      tanggal_lahir: new Date(student.tanggal_lahir)
    };
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};