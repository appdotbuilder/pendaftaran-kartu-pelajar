import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { z } from 'zod';
import { 
  createUserInputSchema,
  loginInputSchema,
  createStudentInputSchema,
  updateStudentInputSchema,
  getStudentByIdSchema,
  getStudentsByFilterSchema,
  createStudentCardInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { login } from './handlers/login';
import { createStudent } from './handlers/create_student';
import { getStudentById } from './handlers/get_student_by_id';
import { getStudents } from './handlers/get_students';
import { updateStudent } from './handlers/update_student';
import { deleteStudent } from './handlers/delete_student';
import { createStudentCard } from './handlers/create_student_card';
import { getStudentCard } from './handlers/get_student_card';
import { getStudentWithCard } from './handlers/get_student_with_card';
import { uploadStudentPhoto } from './handlers/upload_student_photo';
import { generateNIS } from './handlers/generate_nis';
import { generateCardNumber } from './handlers/generate_card_number';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // Student management routes
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),

  // Public registration endpoint that automatically creates user account
  registerStudent: publicProcedure
    .input(createStudentInputSchema.omit({ create_user_account: true }))
    .mutation(({ input }) => createStudent({ ...input, create_user_account: true })),

  getStudentById: publicProcedure
    .input(getStudentByIdSchema)
    .query(({ input }) => getStudentById(input)),

  getStudents: publicProcedure
    .input(getStudentsByFilterSchema)
    .query(({ input }) => getStudents(input)),

  updateStudent: publicProcedure
    .input(updateStudentInputSchema)
    .mutation(({ input }) => updateStudent(input)),

  deleteStudent: publicProcedure
    .input(getStudentByIdSchema)
    .mutation(({ input }) => deleteStudent(input)),

  // Student card management routes
  createStudentCard: publicProcedure
    .input(createStudentCardInputSchema)
    .mutation(({ input }) => createStudentCard(input)),

  getStudentCard: publicProcedure
    .input(getStudentByIdSchema)
    .query(({ input }) => getStudentCard(input)),

  getStudentWithCard: publicProcedure
    .input(getStudentByIdSchema)
    .query(({ input }) => getStudentWithCard(input)),

  // Utility routes
  generateNIS: publicProcedure
    .query(() => generateNIS()),

  generateCardNumber: publicProcedure
    .query(() => generateCardNumber()),

  // File upload route (simplified - in real implementation would handle multipart data)
  uploadStudentPhoto: publicProcedure
    .input(getStudentByIdSchema.extend({
      photo_data: z.string(),
      photo_filename: z.string()
    }))
    .mutation(({ input }) => uploadStudentPhoto(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
  console.log('Student Re-registration and ID Card System API is ready!');
}

start();