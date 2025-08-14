import { serial, text, pgTable, timestamp, integer, boolean, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums for PostgreSQL
export const genderEnum = pgEnum('gender', ['LAKI_LAKI', 'PEREMPUAN']);
export const religionEnum = pgEnum('religion', ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']);
export const livingWithEnum = pgEnum('living_with', ['ORANG_TUA', 'WALI', 'ASRAMA', 'KOST', 'LAINNYA']);
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'SISWA']);

// Users table for authentication and authorization
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Should be hashed in real implementation
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Students table with all registration fields
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  nisn: text('nisn').notNull().unique(), // Nomor Induk Siswa Nasional
  nis: text('nis'), // Nomor Induk Siswa (generated internally), nullable
  nama_lengkap: text('nama_lengkap').notNull(),
  jenis_kelamin: genderEnum('jenis_kelamin').notNull(),
  tempat_lahir: text('tempat_lahir').notNull(),
  tanggal_lahir: date('tanggal_lahir').notNull(),
  alamat_jalan: text('alamat_jalan').notNull(),
  alamat_dusun: text('alamat_dusun'), // Nullable
  alamat_desa: text('alamat_desa').notNull(),
  alamat_kecamatan: text('alamat_kecamatan').notNull(),
  nomor_hp: text('nomor_hp').notNull(),
  agama: religionEnum('agama').notNull(),
  jumlah_saudara: integer('jumlah_saudara').notNull(),
  anak_ke: integer('anak_ke').notNull(),
  tinggal_bersama: livingWithEnum('tinggal_bersama').notNull(),
  asal_sekolah: text('asal_sekolah').notNull(),
  foto_siswa: text('foto_siswa'), // URL/path to uploaded photo, nullable
  user_id: integer('user_id').references(() => usersTable.id), // Link to user account, nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Student cards table for ID card generation
export const studentCardsTable = pgTable('student_cards', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  card_number: text('card_number').notNull().unique(), // Unique card identifier
  masa_berlaku: date('masa_berlaku').notNull(),
  qr_code_data: text('qr_code_data').notNull(), // Contains NISN for QR code
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [usersTable.id],
    references: [studentsTable.user_id],
  }),
}));

export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [studentsTable.user_id],
    references: [usersTable.id],
  }),
  cards: many(studentCardsTable),
}));

export const studentCardsRelations = relations(studentCardsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [studentCardsTable.student_id],
    references: [studentsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;

export type StudentCard = typeof studentCardsTable.$inferSelect;
export type NewStudentCard = typeof studentCardsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  students: studentsTable, 
  studentCards: studentCardsTable 
};