import { GmailClient } from '@/lib/api/gmail';

interface EmailHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate: string;
  payload?: {
    headers: EmailHeader[];
  };
}

interface GmailListResponse {
  messages?: { id: string }[];
}

interface GmailLabel {
  id: string;
  name: string;
}

interface GmailLabelsResponse {
  labels?: GmailLabel[];
}

export interface EmailMetadata {
  id: string;
  threadId: string;
  sender: string;
  subject: string;
  date: Date;
  labels: string[];
  snippet: string;
}

export interface EmailPattern {
  type: 'sender' | 'subject' | 'content';
  value: string;
  frequency: number;
  labels: string[];
}

export class EmailTools {
  private client: GmailClient;
  
  constructor(accessToken: string) {
    this.client = new GmailClient(accessToken);
  }

  /**
   * Fetch and analyze recent emails to identify patterns
   */
  async analyzeEmailPatterns(maxEmails: number = 100): Promise<EmailPattern[]> {
    const messages: GmailListResponse = await this.client.listMessages('', maxEmails);
    const patterns: Map<string, EmailPattern> = new Map();
    
    for (const message of messages.messages || []) {
      const email = await this.client.getMessage(message.id) as GmailMessage;
      const sender = this.extractSender(email);
      const key = `sender:${sender}`;
      
      if (patterns.has(key)) {
        const pattern = patterns.get(key)!;
        pattern.frequency += 1;
        // Convert to array to avoid Set iteration issues
        pattern.labels = Array.from(new Set([...pattern.labels, ...(email.labelIds || [])]));
      } else {
        patterns.set(key, {
          type: 'sender',
          value: sender,
          frequency: 1,
          labels: email.labelIds || []
        });
      }
    }
    
    return Array.from(patterns.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Create a new label or get existing one
   */
  async getOrCreateLabel(name: string): Promise<string> {
    const labels: GmailLabelsResponse = await this.client.listLabels();
    const existingLabel = labels.labels?.find((label: GmailLabel) => label.name === name);
    
    if (existingLabel) {
      return existingLabel.id;
    }
    
    const newLabel = await this.client.createLabel(name);
    return newLabel.id;
  }

  /**
   * Apply labels to a batch of messages matching certain criteria
   */
  async applyLabelsToMatching(
    query: string,
    labelNames: string[],
    maxMessages: number = 100
  ): Promise<number> {
    // First ensure all labels exist
    const labelIds = await Promise.all(
      labelNames.map(name => this.getOrCreateLabel(name))
    );
    
    // Find matching messages
    const messages: GmailListResponse = await this.client.listMessages(query, maxMessages);
    if (!messages.messages?.length) {
      return 0;
    }
    
    // Apply labels in batches of 1000 (Gmail API limit)
    const BATCH_SIZE = 1000;
    for (let i = 0; i < messages.messages.length; i += BATCH_SIZE) {
      const batch = messages.messages.slice(i, i + BATCH_SIZE);
      await this.client.batchModifyMessages(
        batch.map((msg: { id: string }) => msg.id),
        labelIds,
        []
      );
    }
    
    return messages.messages.length;
  }

  /**
   * Extract normalized sender email from message
   */
  private extractSender(message: GmailMessage): string {
    const headers = message.payload?.headers || [];
    const fromHeader = headers.find((header: EmailHeader) => header.name.toLowerCase() === 'from');
    if (!fromHeader) return '';
    
    // Extract email from "Name <email>" format
    const matches = fromHeader.value.match(/<(.+?)>/) || [null, fromHeader.value];
    return matches[1].toLowerCase();
  }

  /**
   * Get simplified email metadata for analysis
   */
  async getEmailMetadata(messageId: string): Promise<EmailMetadata> {
    const message = await this.client.getMessage(messageId) as GmailMessage;
    const headers = message.payload?.headers || [];
    
    return {
      id: message.id,
      threadId: message.threadId,
      sender: this.extractSender(message),
      subject: headers.find((header: EmailHeader) => header.name.toLowerCase() === 'subject')?.value || '',
      date: new Date(parseInt(message.internalDate)),
      labels: message.labelIds || [],
      snippet: message.snippet || ''
    };
  }
}