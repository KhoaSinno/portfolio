import { ConfigService } from '@nestjs/config';
import { ResumeStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeService } from './resume.service';

const portfolioOwnerId = 'portfolio-owner-id';

function createService() {
  const prisma = {
    resume: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    resumeVersion: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
  );

  const config = {
    get: jest.fn().mockReturnValue(portfolioOwnerId),
  };
  return {
    prisma,
    service: new ResumeService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    ),
  };
}

describe('ResumeService ownership bootstrap', () => {
  it('only lets the configured portfolio owner reclaim the canonical resume', async () => {
    const { prisma, service } = createService();
    prisma.resume.findFirst.mockResolvedValueOnce(null);
    prisma.resume.findUnique.mockResolvedValue({
      id: 'portfolio-resume',
      ownerId: 'wrong-owner',
    });
    prisma.resume.update.mockResolvedValue({ id: 'portfolio-resume' });
    prisma.resume.findMany.mockResolvedValue([]);

    await service.listResumes(portfolioOwnerId, 'ntakhoa.work@gmail.com');

    expect(prisma.resume.update).toHaveBeenCalledWith({
      where: { id: 'portfolio-resume' },
      data: { ownerId: portfolioOwnerId, isPrimary: true },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('seeds a demo account from static mock data, never from the canonical resume', async () => {
    const { prisma, service } = createService();
    prisma.resume.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.resume.create.mockResolvedValue({ id: 'demo-resume' });
    prisma.resumeVersion.create.mockResolvedValue({ id: 'version-1' });
    prisma.resume.findMany.mockResolvedValue([]);

    await service.listResumes('demo-owner-id', 'demo@gmail.com');

    expect(prisma.resume.findUnique).not.toHaveBeenCalled();
    expect(prisma.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: 'demo-owner-id',
          title: 'Candidate Profile (Demo Test)',
          content: expect.objectContaining({
            basics: expect.objectContaining({ email: 'demo@example.com' }),
          }),
        }),
      }),
    );
    expect(prisma.resumeVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resumeId: 'demo-resume', version: 1 }),
      }),
    );
  });

  it('serves the public resume only from the configured portfolio owner', async () => {
    const { prisma, service } = createService();
    const resume = {
      id: 'portfolio-resume',
      ownerId: portfolioOwnerId,
      isPrimary: true,
      status: ResumeStatus.PUBLISHED,
    };
    prisma.resume.findFirst.mockResolvedValue(resume);
    prisma.resume.update.mockResolvedValue(resume);

    await expect(service.getPublished()).resolves.toBe(resume);
    expect(prisma.resume.findFirst).toHaveBeenCalledWith({
      where: {
        ownerId: portfolioOwnerId,
        isPrimary: true,
        status: ResumeStatus.PUBLISHED,
      },
    });
  });
});
