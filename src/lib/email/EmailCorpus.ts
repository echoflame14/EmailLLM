// src/lib/email/EmailCorpus.ts

import { GmailClient } from '../api/gmail';

export interface EmailMetadata {
  id: string;
  threadId: string;
  timestamp: number;
  sender: {
    email: string;
    name?: string;
  };
  recipients: Array<{
    email: string;
    name?: string;
    type: 'to' | 'cc' | 'bcc';
  }>;
  subject: string;
  snippet: string;
  labels: string[];
  hasAttachments: boolean;
}

export interface EmailContent {
  id: string;
  body: {
    plain: string;
    html?: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

export class EmailCorpus {
  private metadata: Map<string, EmailMetadata>;
  private content: Map<string, EmailContent>;
  private senderIndex: Map<string, Set<string>>; // email -> Set of message IDs
  private labelIndex: Map<string, Set<string>>; // label -> Set of message IDs
  private threadIndex: Map<string, Set<string>>; // threadId -> Set of message IDs
  private client: GmailClient;

  constructor(accessToken: string) {
    this.metadata = new Map();
    this.content = new Map();
    this.senderIndex = new Map();
    this.labelIndex = new Map();
    this.threadIndex = new Map();
    this.client = new GmailClient(accessToken);
  }

  /**
   * Add a single email to the corpus
   */
  public async addEmail(messageId: string): Promise<void> {
    // Fetch full message data from Gmail
    const message = await this.client.getMessage(messageId);
    
    // Extract and store metadata
    const metadata = this.extractMetadata(message);
    this.metadata.set(messageId, metadata);
    
    // Update indices
    this.updateSenderIndex(metadata);
    this.updateLabelIndex(metadata);
    this.updateThreadIndex(metadata);
    
    // Extract and store content if needed
    if (!this.content.has(messageId)) {
      const content = this.extractContent(message);
      this.content.set(messageId, content);
    }
  }

  /**
   * Batch fetch and add multiple emails
   */
  public async addEmailBatch(query: string, maxResults: number = 100): Promise<number> {
    const response = await this.client.listMessages(query, maxResults);
    const messages = response.messages || [];
    
    await Promise.all(
      messages.map((msg: { id: string }) => this.addEmail(msg.id))
    );
    
    return messages.length;
  }

  /**
   * Query emails by various criteria
   */
  public query(criteria: {
    sender?: string;
    label?: string;
    threadId?: string;
    dateRange?: {
      start: number;
      end: number;
    };
  }): EmailMetadata[] {
    let results: Set<string> | null = null;

    // Start with most specific index if available
    if (criteria.sender && this.senderIndex.has(criteria.sender)) {
      results = new Set(this.senderIndex.get(criteria.sender));
    } else if (criteria.label && this.labelIndex.has(criteria.label)) {
      results = new Set(this.labelIndex.get(criteria.label));
    } else if (criteria.threadId && this.threadIndex.has(criteria.threadId)) {
      results = new Set(this.threadIndex.get(criteria.threadId));
    }

    // Apply additional filters
    if (results === null) {
      // No index matched, start with all messages
      results = new Set(this.metadata.keys());
    }

    // Filter by date range if specified
    if (criteria.dateRange) {
      results = new Set(
        Array.from(results).filter(id => {
          const metadata = this.metadata.get(id)!;
          return metadata.timestamp >= criteria.dateRange!.start &&
                 metadata.timestamp <= criteria.dateRange!.end;
        })
      );
    }

    // Convert results to array of metadata
    return Array.from(results)
      .map(id => this.metadata.get(id)!)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get full content for a message
   */
  public getContent(messageId: string): EmailContent | null {
    return this.content.get(messageId) || null;
  }

  /**
   * Extract metadata from Gmail message
   */
  private extractMetadata(message: any): EmailMetadata {
    const headers = message.payload.headers;
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

    // Parse sender from "From" header
    const fromHeader = getHeader('from') || '';
    const senderMatch = fromHeader.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
    const sender = {
      email: senderMatch?.[2] || fromHeader,
      name: senderMatch?.[1]
    };

    // Parse recipients
    const recipients = [
      ...this.parseRecipients(getHeader('to') || '', 'to'),
      ...this.parseRecipients(getHeader('cc') || '', 'cc'),
      ...this.parseRecipients(getHeader('bcc') || '', 'bcc')
    ];

    return {
      id: message.id,
      threadId: message.threadId,
      timestamp: parseInt(message.internalDate),
      sender,
      recipients,
      subject: getHeader('subject') || '',
      snippet: message.snippet || '',
      labels: message.labelIds || [],
      hasAttachments: this.hasAttachments(message.payload)
    };
  }

  /**
   * Extract content from Gmail message
   */
  private extractContent(message: any): EmailContent {
    const content: EmailContent = {
      id: message.id,
      body: {
        plain: '',
        html: undefined
      }
    };

    // Recursive function to find content parts
    const findContent = (part: any) => {
      if (part.mimeType === 'text/plain') {
        content.body.plain = Buffer.from(part.body.data, 'base64').toString();
      } else if (part.mimeType === 'text/html') {
        content.body.html = Buffer.from(part.body.data, 'base64').toString();
      }
      
      if (part.parts) {
        part.parts.forEach(findContent);
      }
    };

    findContent(message.payload);

    // Extract attachment metadata if present
    if (message.payload.parts) {
      content.attachments = message.payload.parts
        .filter((part: any) => part.filename && part.body.attachmentId)
        .map((part: any) => ({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType,
          size: parseInt(part.body.size)
        }));
    }

    return content;
  }

  /**
   * Parse recipient string into structured data
   */
  private parseRecipients(headerValue: string, type: 'to' | 'cc' | 'bcc') {
    if (!headerValue) return [];

    return headerValue.split(',')
      .map(addr => addr.trim())
      .filter(addr => addr)
      .map(addr => {
        const match = addr.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
        return {
          email: match?.[2] || addr,
          name: match?.[1],
          type
        };
      });
  }

  /**
   * Check if message has attachments
   */
  private hasAttachments(payload: any): boolean {
    if (payload.filename) return true;
    if (!payload.parts) return false;
    return payload.parts.some((part: any) => this.hasAttachments(part));
  }

  /**
   * Update sender index with new message
   */
  private updateSenderIndex(metadata: EmailMetadata): void {
    const email = metadata.sender.email.toLowerCase();
    if (!this.senderIndex.has(email)) {
      this.senderIndex.set(email, new Set());
    }
    this.senderIndex.get(email)!.add(metadata.id);
  }

  /**
   * Update label index with new message
   */
  private updateLabelIndex(metadata: EmailMetadata): void {
    metadata.labels.forEach(label => {
      if (!this.labelIndex.has(label)) {
        this.labelIndex.set(label, new Set());
      }
      this.labelIndex.get(label)!.add(metadata.id);
    });
  }

  /**
   * Update thread index with new message
   */
  private updateThreadIndex(metadata: EmailMetadata): void {
    if (!this.threadIndex.has(metadata.threadId)) {
      this.threadIndex.set(metadata.threadId, new Set());
    }
    this.threadIndex.get(metadata.threadId)!.add(metadata.id);
  }
}