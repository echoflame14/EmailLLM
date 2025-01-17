// src/lib/email/__tests__/EmailCorpus.test.ts

import { EmailCorpus } from '../EmailCorpus';
import { jest } from '@jest/globals';
import { GmailClient } from '../../api/gmail';

describe('EmailCorpus', () => {
  let corpus: EmailCorpus;
  let accessToken: string;

  beforeEach(() => {
    accessToken = 'test-token';
    corpus = new EmailCorpus(accessToken);
  });

  describe('addEmail', () => {
    it('should process and index a single email correctly', async () => {
      const mockMessage = {
        id: 'msg1',
        threadId: 'thread1',
        internalDate: '1634567890000',
        payload: {
          headers: [
            { name: 'From', value: 'John Doe <john@example.com>' },
            { name: 'To', value: 'Jane Smith <jane@example.com>' },
            { name: 'Subject', value: 'Test Email' }
          ],
          parts: [
            {
              mimeType: 'text/plain',
              body: { data: Buffer.from('Hello World').toString('base64') }
            }
          ]
        },
        snippet: 'Email snippet',
        labelIds: ['INBOX', 'UNREAD']
      };

      // Mock the Gmail client
      jest.spyOn(GmailClient.prototype, 'getMessage').mockResolvedValue(mockMessage);

      // Add the email
      await corpus.addEmail('msg1');

      // Test the query functionality
      const results = corpus.query({ sender: 'john@example.com' });
      
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'msg1',
        threadId: 'thread1',
        sender: {
          email: 'john@example.com',
          name: 'John Doe'
        },
        subject: 'Test Email'
      });

      // Test content retrieval
      const content = corpus.getContent('msg1');
      expect(content?.body.plain).toBe('Hello World');
    });
  });

  describe('addEmailBatch', () => {
    it('should process multiple emails correctly', async () => {
      const mockMessages = {
        messages: [
          { id: 'msg1' },
          { id: 'msg2' }
        ]
      };

      // Mock the Gmail client
      jest.spyOn(GmailClient.prototype, 'listMessages').mockResolvedValue(mockMessages);
      jest.spyOn(GmailClient.prototype, 'getMessage').mockImplementation(async (id: string) => ({
        id,
        threadId: `thread_${id}`,
        internalDate: '1634567890000',
        payload: {
          headers: [
            { name: 'From', value: `Sender ${id} <sender${id}@example.com>` },
            { name: 'Subject', value: `Test Email ${id}` }
          ],
          parts: [
            {
              mimeType: 'text/plain',
              body: { data: Buffer.from(`Content ${id}`).toString('base64') }
            }
          ]
        },
        snippet: `Snippet ${id}`,
        labelIds: ['INBOX']
      }));

      // Add batch of emails
      const count = await corpus.addEmailBatch('');

      expect(count).toBe(2);

      // Verify both emails were processed
      const msg1 = corpus.query({ sender: 'sender1@example.com' });
      const msg2 = corpus.query({ sender: 'sender2@example.com' });

      expect(msg1).toHaveLength(1);
      expect(msg2).toHaveLength(1);
    });
  });

  describe('query', () => {
    it('should support multiple query criteria', async () => {
      // Add test emails with various criteria
      const mockMessages = {
        messages: [
          { id: 'msg1' }, // Recent email from sender1
          { id: 'msg2' }, // Older email from sender1
          { id: 'msg3' }  // Recent email from sender2
        ]
      };

      jest.spyOn(GmailClient.prototype, 'listMessages').mockResolvedValue(mockMessages);
      jest.spyOn(GmailClient.prototype, 'getMessage').mockImplementation(async (id) => ({
        id,
        threadId: 'thread1',
        internalDate: id === 'msg2' ? '1634567890000' : '1734567890000',
        payload: {
          headers: [
            { 
              name: 'From', 
              value: id === 'msg3' ? 'sender2@example.com' : 'sender1@example.com' 
            },
            { name: 'Subject', value: 'Test Email' }
          ]
        },
        snippet: 'Snippet',
        labelIds: ['INBOX']
      }));

      await corpus.addEmailBatch('');

      // Test date range query
      const recentEmails = corpus.query({
        dateRange: {
          start: 1700000000000,
          end: 1800000000000
        }
      });
      expect(recentEmails).toHaveLength(2);

      // Test combined sender + date query
      const recentFromSender1 = corpus.query({
        sender: 'sender1@example.com',
        dateRange: {
          start: 1700000000000,
          end: 1800000000000
        }
      });
      expect(recentFromSender1).toHaveLength(1);
    });
  });
});