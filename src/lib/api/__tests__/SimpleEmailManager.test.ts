import { SimpleEmailManager, EmailManagerError } from '../SimpleEmailManager';
import { GmailClient, Message, MessageList } from '../gmail';
import { jest } from '@jest/globals';

describe('SimpleEmailManager', () => {
  let manager: SimpleEmailManager;
  let mockGmailClient: jest.Mocked<GmailClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGmailClient = {
      getMessage: jest.fn(),
      listMessages: jest.fn(),
      batchDelete: jest.fn(),
    } as unknown as jest.Mocked<GmailClient>;

    manager = new SimpleEmailManager(mockGmailClient);
  });

  describe('getRecentEmails', () => {
    it('should throw error if count exceeds 10', async () => {
      await expect(manager.getRecentEmails(11))
        .rejects
        .toThrow('Cannot retrieve more than 10 emails at once');
    });

    it('should handle empty message list', async () => {
      mockGmailClient.listMessages.mockResolvedValue({ 
        messages: [],
        resultSizeEstimate: 0
      });
      
      const result = await manager.getRecentEmails();
      expect(result).toEqual([]);
    });

    it('should correctly process emails with complete data', async () => {
      mockGmailClient.listMessages.mockResolvedValue({
        messages: [
          { id: 'msg1', threadId: 'thread1' },
          { id: 'msg2', threadId: 'thread2' }
        ],
        resultSizeEstimate: 2
      });

      mockGmailClient.getMessage.mockImplementation(async (id) => ({
        id,
        threadId: `thread_${id}`,
        labelIds: ['INBOX'],
        snippet: 'Email content...',
        historyId: '12345',
        internalDate: '1634567890000',
        sizeEstimate: 1024,
        payload: {
          mimeType: 'text/plain',
          headers: [
            { name: 'From', value: 'John Doe <john@example.com>' },
            { name: 'Subject', value: 'Test Email' }
          ],
          body: { size: 0 }
        }
      }));

      const result = await manager.getRecentEmails(2);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'msg1',
        sender: {
          email: 'john@example.com',
          name: 'John Doe'
        }
      });
    });

    it('should handle API errors gracefully', async () => {
      mockGmailClient.listMessages.mockRejectedValue(new Error('API Error'));

      await expect(manager.getRecentEmails())
        .rejects
        .toThrow(EmailManagerError);
    });
  });

  describe('groupBySender', () => {
    it('should group emails by sender correctly', async () => {
      mockGmailClient.listMessages.mockResolvedValue({
        messages: [
          { id: 'msg1', threadId: 'thread1' },
          { id: 'msg2', threadId: 'thread2' },
          { id: 'msg3', threadId: 'thread3' }
        ],
        resultSizeEstimate: 3
      });

      mockGmailClient.getMessage.mockImplementation(async (id) => ({
        id,
        threadId: `thread_${id}`,
        labelIds: ['INBOX'],
        snippet: 'Email content...',
        historyId: '12345',
        internalDate: '1634567890000',
        sizeEstimate: 1024,
        payload: {
          mimeType: 'text/plain',
          headers: [
            { 
              name: 'From', 
              value: id === 'msg3' ? 'Jane Doe <jane@example.com>' : 'John Doe <john@example.com>' 
            },
            { name: 'Subject', value: 'Test Email' }
          ],
          body: { size: 0 }
        }
      }));

      const result = await manager.groupBySender();
      
      expect(result.size).toBe(2);
      expect(result.get('john@example.com')).toHaveLength(2);
      expect(result.get('jane@example.com')).toHaveLength(1);
    });
  });

  describe('deleteFromSender', () => {
    it('should handle deletion of emails from sender', async () => {
      mockGmailClient.listMessages.mockResolvedValue({
        messages: [
          { id: 'msg1', threadId: 'thread1' },
          { id: 'msg2', threadId: 'thread2' }
        ],
        resultSizeEstimate: 2
      });

      await manager.deleteFromSender('spam@example.com');

      expect(mockGmailClient.batchDelete).toHaveBeenCalledWith({
        ids: ['msg1', 'msg2']
      });
    });

    it('should handle no emails from sender', async () => {
      mockGmailClient.listMessages.mockResolvedValue({ 
        messages: [],
        resultSizeEstimate: 0 
      });

      const count = await manager.deleteFromSender('spam@example.com');
      expect(count).toBe(0);
      expect(mockGmailClient.batchDelete).not.toHaveBeenCalled();
    });

    it('should handle large number of emails in batches', async () => {
      const messages = Array(1500).fill(null).map((_, i) => ({ 
        id: `msg${i}`,
        threadId: `thread${i}`
      }));

      mockGmailClient.listMessages.mockResolvedValue({ 
        messages,
        resultSizeEstimate: 1500
      });

      await manager.deleteFromSender('spam@example.com');

      expect(mockGmailClient.batchDelete).toHaveBeenCalledTimes(2);
    });
  });
});