import { z } from 'zod';

// Enums for various fields
export const genderEnum = z.enum(['LAKI_LAKI', 'PEREMPUAN']);
export const religionEnum = z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']);
export const livingWithEnum = z.enum(['ORANG_TUA', 'WALI', 'ASRAMA', 'KOST', 'LAINNYA']);
export const userRoleEnum = z.enum(['ADMIN', 'SISWA']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  role: userRoleEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Student schema with all required fields
export const studentSchema = z.object({
  id: z.number(),
  nisn: z.string(), // Nomor Induk Siswa Nasional
  nis: z.string().nullable(), // Nomor Induk Siswa (generated internally)
  nama_lengkap: z.string(),
  jenis_kelamin: genderEnum,
  tempat_lahir: z.string(),
  tanggal_lahir: z.coerce.date(),
  alamat_jalan: z.string(),
  alamat_dusun: z.string().nullable(),
  alamat_desa: z.string(),
  alamat_kecamatan: z.string(),
  nomor_hp: z.string(),
  agama: religionEnum,
  jumlah_saudara: z.number().int().nonnegative(),
  anak_ke: z.number().int().positive(),
  tinggal_bersama: livingWithEnum,
  asal_sekolah: z.string(),
  foto_siswa: z.string().nullable(), // URL/path to uploaded photo
  user_id: z.number().nullable(), // Link to user account if student has login access
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Student ID Card schema
export const studentCardSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  card_number: z.string(), // Unique card identifier
  masa_berlaku: z.coerce.date(),
  qr_code_data: z.string(), // Contains NISN for QR code
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StudentCard = z.infer<typeof studentCardSchema>;

// Input schemas for creating users
export const createUserInputSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: userRoleEnum
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schemas for creating students
export const createStudentInputSchema = z.object({
  nisn: z.string().min(10).max(10), // NISN should be exactly 10 digits
  nama_lengkap: z.string().min(1),
  jenis_kelamin: genderEnum,
  tempat_lahir: z.string().min(1),
  tanggal_lahir: z.coerce.date(),
  alamat_jalan: z.string().min(1),
  alamat_dusun: z.string().nullable(),
  alamat_desa: z.string().min(1),
  alamat_kecamatan: z.string().min(1),
  nomor_hp: z.string().min(10),
  agama: religionEnum,
  jumlah_saudara: z.number().int().nonnegative(),
  anak_ke: z.number().int().positive(),
  tinggal_bersama: livingWithEnum,
  asal_sekolah: z.string().min(1),
  foto_siswa: z.string().nullable(),
  create_user_account: z.boolean().optional() // Flag to control user account creation
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

// Input schemas for updating students
export const updateStudentInputSchema = z.object({
  id: z.number(),
  nisn: z.string().min(10).max(10).optional(),
  nama_lengkap: z.string().min(1).optional(),
  jenis_kelamin: genderEnum.optional(),
  tempat_lahir: z.string().min(1).optional(),
  tanggal_lahir: z.coerce.date().optional(),
  alamat_jalan: z.string().min(1).optional(),
  alamat_dusun: z.string().nullable().optional(),
  alamat_desa: z.string().min(1).optional(),
  alamat_kecamatan: z.string().min(1).optional(),
  nomor_hp: z.string().min(10).optional(),
  agama: religionEnum.optional(),
  jumlah_saudara: z.number().int().nonnegative().optional(),
  anak_ke: z.number().int().positive().optional(),
  tinggal_bersama: livingWithEnum.optional(),
  asal_sekolah: z.string().min(1).optional(),
  foto_siswa: z.string().nullable().optional()
});

export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

// Input schema for creating student cards
export const createStudentCardInputSchema = z.object({
  student_id: z.number(),
  masa_berlaku: z.coerce.date()
});

export type CreateStudentCardInput = z.infer<typeof createStudentCardInputSchema>;

// Login input schema
export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Query schemas
export const getStudentByIdSchema = z.object({
  id: z.number()
});

export type GetStudentByIdInput = z.infer<typeof getStudentByIdSchema>;

export const getStudentsByFilterSchema = z.object({
  nisn: z.string().optional(),
  nama_lengkap: z.string().optional(),
  kelas: z.string().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type GetStudentsByFilterInput = z.infer<typeof getStudentsByFilterSchema>;

// Student with card info for display
export const studentWithCardSchema = z.object({
  student: studentSchema,
  card: studentCardSchema.nullable()
});

export type StudentWithCard = z.infer<typeof studentWithCardSchema>;