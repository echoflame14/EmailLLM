// src/lib/email/__tests__/EmailCorpus.test.ts

import { EmailCorpus } from '../EmailCorpus';
import { GmailClient } from '../../api/gmail';
import { jest } from '@jest/globals';

describe('EmailCorpus', () => {
  let corpus: EmailCorpus;
  let mockGmailClient: jest.Mocked<GmailClient>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock GmailClient
    mockGmailClient = {
      getMessage: jest.fn(),
      listMessages: jest.fn(),
    } as unknown as jest.Mocked<GmailClient>;

    corpus = new EmailCorpus('test-token');
    // @ts-ignore - Replace the real client with our mock
    corpus['client'] = mockGmailClient;
  });

  describe('addEmail', () => {
    it('should correctly process a simple email', async () => {
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

      mockGmailClient.getMessage.mockResolvedValue(mockMessage);

      await corpus.addEmail('msg1');

      // Test metadata extraction
      const results = corpus.query({ sender: 'john@example.com' });
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'msg1',
        threadId: 'thread1',
        sender: {
          email: 'john@example.com',
          name: 'John Doe'
        },
        subject: 'Test Email',
        labels: ['INBOX', 'UNREAD']
      });

      // Test content extraction
      const content = corpus.getContent('msg1');
      expect(content).toBeDefined();
      expect(content?.body.plain).toBe('Hello World');
    });

    it('should handle emails with missing fields', async () => {
      const mockMessage = {
        id: 'msg2',
        threadId: 'thread2',
        internalDate: '1634567890000',
        payload: {
          headers: [
            { name: 'From', value: '<no-name@example.com>' },
            // Missing To and Subject headers
          ],
          // No parts
        },
        // No snippet
        labelIds: [] // Empty labels
      };

      mockGmailClient.getMessage.mockResolvedValue(mockMessage);

      await corpus.addEmail('msg2');

      const results = corpus.query({ sender: 'no-name@example.com' });
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'msg2',
        sender: {
          email: 'no-name@example.com',
          name: undefined
        },
        subject: '',
        recipients: [],
        labels: []
      });
    });

    it('should handle complex email addresses', async () => {
      const mockMessage = {
        id: 'msg3',
        threadId: 'thread3',
        internalDate: '1634567890000',
        payload: {
          headers: [
            { name: 'From', value: '"Smith, John (Engineering)" <john.smith@company.example.com>' },
            { name: 'To', value: 'Jane Doe <jane.doe@example.com>, Team <team@example.com>' },
            { name: 'Cc', value: 'support@example.com, "Help Desk" <help@example.com>' }
          ]
        },
        labelIds: ['INBOX']
      };

      mockGmailClient.getMessage.mockResolvedValue(mockMessage);

      await corpus.addEmail('msg3');

      const results = corpus.query({ sender: 'john.smith@company.example.com' });
      expect(results).toHaveLength(1);
      expect(results[0].sender).toEqual({
        email: 'john.smith@company.example.com',
        name: 'Smith, John (Engineering)'
      });
      expect(results[0].recipients).toHaveLength(4); // 2 To + 2 Cc
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      // Set up some test data
      const mockMessages = [
        {
          id: 'msg1',
          threadId: 'thread1',
          internalDate: '1634567890000', // older
          payload: {
            headers: [
              { name: 'From', value: 'sender1@example.com' },
              { name: 'Subject', value: 'Test 1' }
            ]
          },
          labelIds: ['INBOX', 'IMPORTANT']
        },
        {
          id: 'msg2',
          threadId: 'thread1',
          internalDate: '1734567890000', // newer
          payload: {
            headers: [
              { name: 'From', value: 'sender1@example.com' },
              { name: 'Subject', value: 'Test 2' }
            ]
          },
          labelIds: ['INBOX']
        },
        {
          id: 'msg3',
          threadId: 'thread2',
          internalDate: '1734567890000', // newer
          payload: {
            headers: [
              { name: 'From', value: 'sender2@example.com' },
              { name: 'Subject', value: 'Test 3' }
            ]
          },
          labelIds: ['INBOX', 'IMPORTANT']
        }
      ];

      mockGmailClient.listMessages.mockResolvedValue({ messages: mockMessages });
      mockGmailClient.getMessage.mockImplementation(async (id) => 
        mockMessages.find(msg => msg.id === id)!
      );

      await corpus.addEmailBatch('', 10);
    });

    it('should filter by sender', () => {
      const results = corpus.query({ sender: 'sender1@example.com' });
      expect(results).toHaveLength(2);
      expect(results.every(msg => msg.sender.email === 'sender1@example.com')).toBe(true);
    });

    it('should filter by label', () => {
      const results = corpus.query({ label: 'IMPORTANT' });
      expect(results).toHaveLength(2);
      expect(results.every(msg => msg.labels.includes('IMPORTANT'))).toBe(true);
    });

    it('should filter by thread', () => {
      const results = corpus.query({ threadId: 'thread1' });
      expect(results).toHaveLength(2);
      expect(results.every(msg => msg.threadId === 'thread1')).toBe(true);
    });

    it('should filter by date range', () => {
      const results = corpus.query({
        dateRange: {
          start: 1700000000000,
          end: 1800000000000
        }
      });
      expect(results).toHaveLength(2); // Only the newer messages
      expect(results.every(msg => msg.timestamp >= 1700000000000)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const results = corpus.query({
        sender: 'sender1@example.com',
        label: 'IMPORTANT',
        dateRange: {
          start: 1600000000000,
          end: 1700000000000
        }
      });
      expect(results).toHaveLength(1); // Only msg1 matches all criteria
      expect(results[0].id).toBe('msg1');
    });

    it('should sort results by timestamp descending', () => {
      const results = corpus.query({}); // Get all messages
      expect(results).toHaveLength(3);
      expect(results[0].timestamp).toBeGreaterThan(results[2].timestamp);
    });
  });

  describe('addEmailBatch', () => {
    it('should handle empty response', async () => {
      mockGmailClient.listMessages.mockResolvedValue({});
      const count = await corpus.addEmailBatch('');
      expect(count).toBe(0);
    });

    it('should process multiple emails in parallel', async () => {
      const mockMessages = {
        messages: [
          { id: 'msg1' },
          { id: 'msg2' },
          { id: 'msg3' }
        ]
      };

      mockGmailClient.listMessages.mockResolvedValue(mockMessages);
      mockGmailClient.getMessage.mockImplementation(async (id) => ({
        id,
        threadId: 'thread1',
        internalDate: '1634567890000',
        payload: {
          headers: [
            { name: 'From', value: `sender@example.com` },
            { name: 'Subject', value: `Test ${id}` }
          ]
        },
        labelIds: ['INBOX']
      }));

      const count = await corpus.addEmailBatch('');
      expect(count).toBe(3);
      expect(mockGmailClient.getMessage).toHaveBeenCalledTimes(3);

      // Verify all messages were processed
      const results = corpus.query({});
      expect(results).toHaveLength(3);
    });

    it('should respect maxResults parameter', async () => {
      const mockMessages = Array(150).fill(null).map((_, i) => ({
        id: `msg${i}`,
        threadId: `thread${i}`,
        internalDate: '1634567890000',
        payload: {
          headers: [
            { name: 'From', value: 'test@example.com' },
            { name: 'Subject', value: `Test ${i}` }
          ]
        },
        labelIds: ['INBOX']
      }));

      mockGmailClient.listMessages.mockResolvedValue({
        messages: mockMessages.slice(0, 50) // Only return first 50 messages
      });
      
      // Mock getMessage to return the corresponding mock message
      mockGmailClient.getMessage.mockImplementation(async (id) => 
        mockMessages.find(msg => msg.id === id)
      );

      const count = await corpus.addEmailBatch('', 50);
      expect(mockGmailClient.listMessages).toHaveBeenCalledWith('', 50);
    });
  });
});