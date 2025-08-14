import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, usersTable } from '../db/schema';
import { uploadStudentPhoto } from '../handlers/upload_student_photo';
import { eq } from 'drizzle-orm';
import { existsSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Sample base64 image data (1x1 pixel PNG)
const validBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Test input data
const testStudentData = {
    nisn: '1234567890',
    nama_lengkap: 'Test Student',
    jenis_kelamin: 'LAKI_LAKI' as const,
    tempat_lahir: 'Jakarta',
    tanggal_lahir: '2005-01-01', // Convert Date to string format
    alamat_jalan: 'Jl. Test No. 123',
    alamat_dusun: null,
    alamat_desa: 'Test Village',
    alamat_kecamatan: 'Test District',
    nomor_hp: '081234567890',
    agama: 'ISLAM' as const,
    jumlah_saudara: 2,
    anak_ke: 1,
    tinggal_bersama: 'ORANG_TUA' as const,
    asal_sekolah: 'SMP Test',
    foto_siswa: null
};

const uploadDir = join(process.cwd(), 'uploads', 'photos');

describe('uploadStudentPhoto', () => {
    beforeEach(async () => {
        await createDB();
        // Ensure upload directory exists
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }
    });

    afterEach(async () => {
        await resetDB();
        // Clean up uploaded files
        if (existsSync(uploadDir)) {
            try {
                rmSync(uploadDir, { recursive: true, force: true });
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    it('should upload photo successfully with valid PNG image', async () => {
        // Create test student
        const studentResult = await db.insert(studentsTable)
            .values(testStudentData)
            .returning()
            .execute();

        const student = studentResult[0];

        const uploadInput = {
            id: student.id,
            photo_data: validBase64Image,
            photo_filename: 'test-photo.png'
        };

        const result = await uploadStudentPhoto(uploadInput);

        // Verify return value format
        expect(result).toMatch(/^\/uploads\/photos\/student_\d+_[a-f0-9]+\.png$/);

        // Verify file was created
        const filePath = join(process.cwd(), result.substring(1)); // Remove leading slash
        expect(existsSync(filePath)).toBe(true);

        // Verify database was updated
        const updatedStudent = await db.select()
            .from(studentsTable)
            .where(eq(studentsTable.id, student.id))
            .execute();

        expect(updatedStudent[0].foto_siswa).toBe(result);
        expect(updatedStudent[0].updated_at).toBeInstanceOf(Date);
    });

    it('should upload photo successfully with valid JPG image', async () => {
        // Create test student
        const studentResult = await db.insert(studentsTable)
            .values(testStudentData)
            .returning()
            .execute();

        const student = studentResult[0];

        // Use JPG base64 data (same 1x1 pixel but with JPG format)
        const jpgBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';

        const uploadInput = {
            id: student.id,
            photo_data: jpgBase64,
            photo_filename: 'test-photo.jpg'
        };

        const result = await uploadStudentPhoto(uploadInput);

        // Verify return value format for JPG
        expect(result).toMatch(/^\/uploads\/photos\/student_\d+_[a-f0-9]+\.jpg$/);

        // Verify file was created
        const filePath = join(process.cwd(), result.substring(1));
        expect(existsSync(filePath)).toBe(true);
    });

    it('should handle JPEG extension correctly', async () => {
        // Create test student
        const studentResult = await db.insert(studentsTable)
            .values(testStudentData)
            .returning()
            .execute();

        const student = studentResult[0];

        const uploadInput = {
            id: student.id,
            photo_data: validBase64Image,
            photo_filename: 'test-photo.JPEG'
        };

        const result = await uploadStudentPhoto(uploadInput);

        // Should normalize to lowercase
        expect(result).toMatch(/^\/uploads\/photos\/student_\d+_[a-f0-9]+\.jpeg$/);
    });

    it('should throw error when student does not exist', async () => {
        const uploadInput = {
            id: 999999,
            photo_data: validBase64Image,
            photo_filename: 'test-photo.png'
        };

        await expect(uploadStudentPhoto(uploadInput)).rejects.toThrow(/Student with ID 999999 not found/i);
    });

    it('should throw error for invalid file extension', async () => {
        // Create test student
        const studentResult = await db.insert(studentsTable)
            .values(testStudentData)
            .returning()
            .execute();

        const student = studentResult[0];

        const uploadInput = {
            id: student.id,
            photo_data: validBase64Image,
            photo_filename: 'test-photo.gif'
        };

        await expect(uploadStudentPhoto(uploadInput)).rejects.toThrow(/Invalid file format.*Only JPG and PNG files are allowed/i);
    });

    it('should throw error for invalid base64 data format', async () => {
        // Create test student
        const studentResult = await db.insert(studentsTable)
            .values(testStudentData)
            .returning()
            .execute();

        const student = studentResult[0];

        const uploadInput = {
            id: student.id,
            photo_data: 'invalid-base64-data',
            photo_filename: 'test-photo.png'
        };

        await expect(uploadStudentPhoto(uploadInput)).rejects.toThrow(/Invalid photo data format.*Expected base64 encoded image/i);
    });

    it('should throw error for missing base64 content', async () => {
        // Create test student
        const studentResult = await db.insert(studentsTable)
            .values(testStudentData)
            .returning()
            .execute();

        const student = studentResult[0];

        const uploadInput = {
            id: student.id,
            photo_data: 'data:image/png;base64,',
            photo_filename: 'test-photo.png'
        };

        await expect(uploadStudentPhoto(uploadInput)).rejects.toThrow(/Invalid base64 image data/i);
    });

    it('should update existing photo path', async () => {
        // Create test student with existing photo
        const studentWithPhoto = {
            ...testStudentData,
            foto_siswa: '/uploads/photos/old-photo.png'
        };

        const studentResult = await db.insert(studentsTable)
            .values(studentWithPhoto)
            .returning()
            .execute();

        const student = studentResult[0];

        const uploadInput = {
            id: student.id,
            photo_data: validBase64Image,
            photo_filename: 'new-photo.png'
        };

        const result = await uploadStudentPhoto(uploadInput);

        // Verify new photo path is different from old one
        expect(result).not.toBe('/uploads/photos/old-photo.png');
        expect(result).toMatch(/^\/uploads\/photos\/student_\d+_[a-f0-9]+\.png$/);

        // Verify database was updated with new photo path
        const updatedStudent = await db.select()
            .from(studentsTable)
            .where(eq(studentsTable.id, student.id))
            .execute();

        expect(updatedStudent[0].foto_siswa).toBe(result);
    });

    it('should generate unique filenames for multiple uploads', async () => {
        // Create test student
        const studentResult = await db.insert(studentsTable)
            .values(testStudentData)
            .returning()
            .execute();

        const student = studentResult[0];

        const uploadInput = {
            id: student.id,
            photo_data: validBase64Image,
            photo_filename: 'test-photo.png'
        };

        // Upload first photo
        const result1 = await uploadStudentPhoto(uploadInput);

        // Upload second photo
        const result2 = await uploadStudentPhoto(uploadInput);

        // Filenames should be different
        expect(result1).not.toBe(result2);

        // Both files should exist
        const filePath1 = join(process.cwd(), result1.substring(1));
        const filePath2 = join(process.cwd(), result2.substring(1));

        expect(existsSync(filePath1)).toBe(true);
        expect(existsSync(filePath2)).toBe(true);
    });
});