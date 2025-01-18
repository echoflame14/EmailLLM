import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface EmailPattern {
  sender: string;
  frequency: number;
  category?: string;
  lastReceived: Date;
}

export class EmailTools {
  private gmail: gmail_v1.Gmail;

  constructor(private accessToken: string) {
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  /**
   * Analyzes email patterns from recent messages
   * @param limit Number of recent emails to analyze
   * @returns Promise containing email patterns
   */
  async analyzeEmailPatterns(limit: number): Promise<EmailPattern[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: limit
      });

      if (!response.data.messages) {
        return [];
      }

      const patterns = new Map<string, EmailPattern>();

      // Process each message to build patterns
      for (const message of response.data.messages) {
        const details = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id!
        });

        const headers = details.data.payload?.headers;
        const from = headers?.find((h: gmail_v1.Schema$MessagePartHeader) => h.name?.toLowerCase() === 'from')?.value || '';
        const date = headers?.find((h: gmail_v1.Schema$MessagePartHeader) => h.name?.toLowerCase() === 'date')?.value;

        if (patterns.has(from)) {
          const pattern = patterns.get(from)!;
          pattern.frequency++;
          if (date) {
            pattern.lastReceived = new Date(date);
          }
        } else {
          patterns.set(from, {
            sender: from,
            frequency: 1,
            lastReceived: date ? new Date(date) : new Date()
          });
        }
      }

      return Array.from(patterns.values());
    } catch (error) {
      throw new Error(`Failed to analyze patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a new label or returns existing label ID
   * @param name The name of the label to create
   * @returns Promise containing the label ID
   */
  async createLabel(name: string): Promise<string> {
    try {
      // First check if label already exists
      const existingLabel = await this.gmail.users.labels.list({
        userId: 'me'
      });

      const found = existingLabel.data.labels?.find(
        (label: gmail_v1.Schema$Label) => label.name?.toLowerCase() === name.toLowerCase()
      );

      if (found && found.id) {
        return found.id;
      }

      // Create new label if it doesn't exist
      const response = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show'
        }
      });

      return response.data.id || '';
    } catch (error) {
      throw new Error(`Failed to create label: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Applies specified labels to emails matching the query
   * @param query Search query to find matching emails
   * @param labelIds Array of label IDs to apply
   * @returns Promise containing the number of emails modified
   */
  async applyLabels(query: string, labelIds: string[]): Promise<number> {
    try {
      const messages = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50
      });

      if (!messages.data.messages) {
        return 0;
      }

      const modifyPromises = messages.data.messages.map((message: gmail_v1.Schema$Message) => 
        this.gmail.users.messages.modify({
          userId: 'me',
          id: message.id!,
          requestBody: {
            addLabelIds: labelIds
          }
        })
      );

      await Promise.all(modifyPromises);
      return messages.data.messages.length;
    } catch (error) {
      throw new Error(`Failed to apply labels: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets metadata for a specific message
   * @param messageId The ID of the message to fetch
   * @returns Promise containing the message metadata
   */
  async getMessageMetadata(messageId: string): Promise<gmail_v1.Schema$Message> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata'
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get message metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}