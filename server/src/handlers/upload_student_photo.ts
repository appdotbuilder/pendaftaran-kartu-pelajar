import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type GetStudentByIdInput } from '../schema';
import { eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

interface UploadPhotoInput extends GetStudentByIdInput {
    photo_data: string; // Base64 encoded image or file path
    photo_filename: string; // Original filename for proper extension handling
}

export async function uploadStudentPhoto(input: UploadPhotoInput): Promise<string> {
    try {
        // Validate student exists
        const student = await db.select()
            .from(studentsTable)
            .where(eq(studentsTable.id, input.id))
            .execute();

        if (student.length === 0) {
            throw new Error(`Student with ID ${input.id} not found`);
        }

        // Validate file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        const fileExtension = input.photo_filename.toLowerCase().substring(input.photo_filename.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
            throw new Error(`Invalid file format. Only JPG and PNG files are allowed`);
        }

        // Validate base64 data
        if (!input.photo_data || !input.photo_data.startsWith('data:image/')) {
            throw new Error('Invalid photo data format. Expected base64 encoded image');
        }

        // Extract the base64 content (remove data:image/[type];base64, prefix)
        const base64Data = input.photo_data.split(',')[1];
        if (!base64Data) {
            throw new Error('Invalid base64 image data');
        }

        // Create unique filename
        const randomId = randomBytes(16).toString('hex');
        const uniqueFilename = `student_${input.id}_${randomId}${fileExtension}`;

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'uploads', 'photos');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }

        // Write file to disk
        const filePath = join(uploadDir, uniqueFilename);
        const imageBuffer = Buffer.from(base64Data, 'base64');
        writeFileSync(filePath, imageBuffer);

        // Generate relative path for database storage
        const relativePath = `/uploads/photos/${uniqueFilename}`;

        // Update student record with photo path
        await db.update(studentsTable)
            .set({ 
                foto_siswa: relativePath,
                updated_at: new Date()
            })
            .where(eq(studentsTable.id, input.id))
            .execute();

        return relativePath;
    } catch (error) {
        console.error('Photo upload failed:', error);
        throw error;
    }
}