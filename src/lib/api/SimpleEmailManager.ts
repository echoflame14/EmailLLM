import { GmailClient, Message, MessageFormat, GmailAPIError, GmailAuthError } from './gmail';

export interface SimpleEmail {
  id: string;
  threadId: string;
  subject: string;
  snippet?: string;
  date: Date;
  sender: {
    name?: string;
    email: string;
  };
}

export class EmailManagerError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EmailManagerError';
  }
}

export class SimpleEmailManager {
  private gmailClient: GmailClient;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new EmailManagerError('Access token is required');
    }
    const refreshFunction = async () => {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        return data.accessToken;
      } else {
        throw new Error(data.message);
      }
    };
    this.gmailClient = new GmailClient(accessToken, refreshFunction);
  }
  async getRecentEmails(limit: number = 10): Promise<SimpleEmail[]> {
    try {
      if (limit > 10) {
        throw new EmailManagerError('Cannot retrieve more than 10 emails at once');
      }
  
      console.log(`Fetching ${limit} recent emails...`);
      const response = await this.gmailClient.listMessages({ 
        maxResults: limit,
        labelIds: ['INBOX']
      });
  
      // Check if the response is valid and contains messages
      if (!response || !response.messages?.length) {
        console.log('No messages found in inbox');
        return [];
      }
  
      console.log(`Found ${response.messages.length} messages, fetching details...`);
      const emails: SimpleEmail[] = [];
      const errors: Error[] = [];
  
      for (const msg of response.messages) {
        try {
          const email = await this.gmailClient.getMessage(msg.id, {
            format: MessageFormat.Metadata,
            metadataHeaders: ['From', 'Subject', 'Date']
          });
          emails.push(this.parseMessage(email));
        } catch (error) {
          console.error(`Error fetching message ${msg.id}:`, error);
          errors.push(error as Error);
          // Continue with other messages
          continue;
        }
      }
  
      // If we didn't get any emails and had errors, throw
      if (emails.length === 0 && errors.length > 0) {
        throw new EmailManagerError(
          'Failed to fetch any emails',
          errors[0]
        );
      }
  
      return emails;
    } catch (error) {
      console.error('Error in getRecentEmails:', error);
      
      // Handle specific error types
      if (error instanceof GmailAuthError) {
        throw new EmailManagerError('Authentication failed - please sign in again', error);
      }
      if (error instanceof GmailAPIError) {
        throw new EmailManagerError(
          `Gmail API error: ${error.message} (${error.status})`,
          error
        );
      }
      
      throw new EmailManagerError(
        'Failed to fetch recent emails',
        error instanceof Error ? error : undefined
      );
    }
  }

  async groupBySender(): Promise<Map<string, SimpleEmail[]>> {
    try {
      const emails = await this.getRecentEmails(10);
      const groups = new Map<string, SimpleEmail[]>();

      for (const email of emails) {
        const existing = groups.get(email.sender.email) || [];
        groups.set(email.sender.email, [...existing, email]);
      }

      return groups;
    } catch (error) {
      console.error('Error in groupBySender:', error);
      throw new EmailManagerError(
        'Failed to group emails by sender',
        error instanceof Error ? error : undefined
      );
    }
  }

  async deleteFromSender(senderEmail: string): Promise<number> {
    try {
      console.log(`Finding emails from sender: ${senderEmail}`);
      const response = await this.gmailClient.listMessages({
        q: `from:${senderEmail}`,
        maxResults: 500
      });

      if (!response.messages?.length) {
        console.log('No messages found from this sender');
        return 0;
      }

      console.log(`Found ${response.messages.length} messages to delete`);
      const messageIds = response.messages.map(msg => msg.id);
      for (let i = 0; i < messageIds.length; i += 1000) {
        const batch = messageIds.slice(i, i + 1000);
        await this.gmailClient.batchDelete({ ids: batch });
      }

      return messageIds.length;
    } catch (error) {
      console.error('Error in deleteFromSender:', error);
      throw new EmailManagerError(
        `Failed to delete emails from ${senderEmail}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private parseMessage(msg: Message): SimpleEmail {
    try {
      const headers = msg.payload.headers;
      const from = this.getHeader(headers, 'From') || '';
      const { name, email } = this.parseFromHeader(from);
      
      return {
        id: msg.id,
        threadId: msg.threadId,
        subject: this.getHeader(headers, 'Subject') || '(no subject)',
        snippet: msg.snippet,
        date: new Date(Number(msg.internalDate)),
        sender: { name, email }
      };
    } catch (error) {
      console.error('Error parsing message:', error);
      throw new EmailManagerError(
        'Failed to parse email message',
        error instanceof Error ? error : undefined
      );
    }
  }

  private getHeader(headers: Message['payload']['headers'], name: string): string | null {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || null;
  }

  private parseFromHeader(from: string): { name?: string; email: string } {
    const match = from.match(/^(?:([^<]*?)\s*)?<?([^\s>]+@[^\s>]+)>?$/);
    if (!match) {
      return { email: from.trim() };
    }
    
    const [, name, email] = match;
    return {
      name: name?.trim(),
      email: email.trim()
    };
  }
}