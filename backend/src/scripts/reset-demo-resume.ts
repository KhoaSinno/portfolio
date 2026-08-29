import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeService } from '../resume/resume.service';

config();

const demoEmail = 'demo@gmail.com';
const confirmation = process.env.RESET_DEMO_CONFIRM;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

async function main() {
  if (!supabaseUrl) fail('SUPABASE_URL is not configured in backend/.env.');
  if (!serviceRoleKey)
    fail('SUPABASE_SERVICE_ROLE_KEY is not configured in backend/.env.');
  if (confirmation !== demoEmail)
    fail(`Set RESET_DEMO_CONFIRM=${demoEmail} to reset only this demo user.`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) fail(`Could not list Supabase users: ${error.message}`);

  const demoUser = data.users.find(
    (user) => user.email?.toLowerCase() === demoEmail,
  );
  if (!demoUser) fail(`Supabase user ${demoEmail} was not found.`);

  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    const deleted = await prisma.resume.deleteMany({
      where: { ownerId: demoUser.id },
    });

    const resumeService = new ResumeService(prisma, new ConfigService());
    const resumes = await resumeService.listResumes(demoUser.id, demoEmail);
    const seeded = resumes[0];
    if (!seeded) fail('Demo reset did not create a replacement resume.');

    console.log(
      `Reset ${deleted.count} resume(s) and seeded ${seeded.title} for ${demoEmail}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
