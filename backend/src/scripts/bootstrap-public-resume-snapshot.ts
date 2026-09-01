import { config } from 'dotenv';
import { PrismaService } from '../prisma/prisma.service';

config();

const resumeId = 'portfolio-resume';

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

async function main() {
  const endpoint = process.env.FRONTEND_REVALIDATE_URL;
  const secret = process.env.RESUME_REVALIDATE_SECRET;
  if (!endpoint)
    fail('FRONTEND_REVALIDATE_URL is not configured in backend/.env.');
  if (!secret)
    fail('RESUME_REVALIDATE_SECRET is not configured in backend/.env.');

  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) fail(`Published resume '${resumeId}' was not found.`);
    if (resume.status !== 'PUBLISHED')
      fail(`Resume '${resumeId}' is not published.`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId,
        content: resume.content,
        sourceUpdatedAt: resume.updatedAt.toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) fail(`Frontend returned HTTP ${response.status}.`);

    const projects = Array.isArray(
      (resume.content as { projects?: unknown }).projects,
    )
      ? (resume.content as { projects: unknown[] }).projects.length
      : 0;
    console.log(
      `Bootstrapped '${resumeId}' snapshot with ${projects} project(s).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
