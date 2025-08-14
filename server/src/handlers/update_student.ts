import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateStudent(input: UpdateStudentInput): Promise<Student | null> {
  try {
    // First check if student exists
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    if (existingStudent.length === 0) {
      return null;
    }

    // Prepare update values, excluding the id field
    const { id, ...updateData } = input;
    
    // Only include fields that are actually provided
    const updateValues: Partial<typeof studentsTable.$inferInsert> = {};
    
    if (updateData.nisn !== undefined) updateValues.nisn = updateData.nisn;
    if (updateData.nama_lengkap !== undefined) updateValues.nama_lengkap = updateData.nama_lengkap;
    if (updateData.jenis_kelamin !== undefined) updateValues.jenis_kelamin = updateData.jenis_kelamin;
    if (updateData.tempat_lahir !== undefined) updateValues.tempat_lahir = updateData.tempat_lahir;
    if (updateData.tanggal_lahir !== undefined) updateValues.tanggal_lahir = updateData.tanggal_lahir.toISOString().split('T')[0];
    if (updateData.alamat_jalan !== undefined) updateValues.alamat_jalan = updateData.alamat_jalan;
    if (updateData.alamat_dusun !== undefined) updateValues.alamat_dusun = updateData.alamat_dusun;
    if (updateData.alamat_desa !== undefined) updateValues.alamat_desa = updateData.alamat_desa;
    if (updateData.alamat_kecamatan !== undefined) updateValues.alamat_kecamatan = updateData.alamat_kecamatan;
    if (updateData.nomor_hp !== undefined) updateValues.nomor_hp = updateData.nomor_hp;
    if (updateData.agama !== undefined) updateValues.agama = updateData.agama;
    if (updateData.jumlah_saudara !== undefined) updateValues.jumlah_saudara = updateData.jumlah_saudara;
    if (updateData.anak_ke !== undefined) updateValues.anak_ke = updateData.anak_ke;
    if (updateData.tinggal_bersama !== undefined) updateValues.tinggal_bersama = updateData.tinggal_bersama;
    if (updateData.asal_sekolah !== undefined) updateValues.asal_sekolah = updateData.asal_sekolah;
    if (updateData.foto_siswa !== undefined) updateValues.foto_siswa = updateData.foto_siswa;

    // Always update the updated_at timestamp  
    updateValues.updated_at = new Date();

    // If no fields to update, return the existing student
    if (Object.keys(updateValues).length === 1) { // Only updated_at
      return {
        ...existingStudent[0],
        tanggal_lahir: new Date(existingStudent[0].tanggal_lahir),
        created_at: new Date(existingStudent[0].created_at!),
        updated_at: new Date(existingStudent[0].updated_at!)
      };
    }

    // Perform the update
    const result = await db.update(studentsTable)
      .set(updateValues)
      .where(eq(studentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    const updatedStudent = result[0];
    return {
      ...updatedStudent,
      tanggal_lahir: new Date(updatedStudent.tanggal_lahir),
      created_at: new Date(updatedStudent.created_at!),
      updated_at: new Date(updatedStudent.updated_at!)
    };
  } catch (error) {
    console.error('Student update failed:', error);
    throw error;
  }
}