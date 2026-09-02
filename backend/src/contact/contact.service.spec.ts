import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactTopic } from '../generated/prisma/client';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  const create = jest.fn();
  const update = jest.fn();
  const prisma = {
    contactMessage: { create, update, delete: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    create.mockResolvedValue({
      id: 'contact-1',
      topic: ContactTopic.GENERAL,
      email: 'visitor@example.com',
      message: 'Hello there',
      jdLink: null,
      fileName: null,
      fileSize: null,
    });
    update.mockResolvedValue(undefined);
  });

  function service() {
    const config = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'PORTFOLIO_OWNER_ID') return 'owner-id';
        return undefined;
      }),
    };
    return new ContactService(prisma as never, config as unknown as ConfigService);
  }

  it('persists a general contact with normalized email and no attachment', async () => {
    const result = await service().submitContact({
      topic: ContactTopic.GENERAL,
      email: ' Visitor@Example.com ',
      message: '  Hello there  ',
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        topic: ContactTopic.GENERAL,
        email: 'visitor@example.com',
        message: 'Hello there',
        jdLink: null,
        attachmentMimeType: null,
      }),
    });
    expect(result).toEqual(
      expect.objectContaining({ success: true, id: 'contact-1' }),
    );
  });

  it('rejects JD data for a non-hiring topic before it reaches storage', async () => {
    await expect(
      service().submitContact({
        topic: ContactTopic.COLLABORATION,
        email: 'visitor@example.com',
        message: 'Let us collaborate.',
        jdLink: 'https://example.com/job',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a spoofed PDF before a contact record is created', async () => {
    await expect(
      service().submitContact(
        {
          topic: ContactTopic.HIRING,
          email: 'visitor@example.com',
          message: 'Please review this role.',
        },
        {
          originalname: 'not-a-pdf.pdf',
          mimetype: 'application/pdf',
          size: 12,
          buffer: Buffer.from('not a PDF'),
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });
});
