// src/lib/api/gmail.ts

/**
 * Gmail API Error types
 */
export class GmailAPIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public code: string,
    public errors: Array<{
      domain: string;
      reason: string;
      message: string;
    }>,
    message: string
  ) {
    super(message);
    this.name = 'GmailAPIError';
  }
}

export class GmailRateLimitError extends GmailAPIError {
  constructor(
    public retryAfter?: number,
    message = 'Gmail API rate limit exceeded'
  ) {
    super(429, 'Too Many Requests', 'rateLimitExceeded', [], message);
    this.name = 'GmailRateLimitError';
  }
}

export class GmailAuthError extends GmailAPIError {
  constructor(message = 'Gmail API authentication failed') {
    super(401, 'Unauthorized', 'unauthorized', [], message);
    this.name = 'GmailAuthError';
  }
}

/**
 * Gmail API Enums
 */
export enum MessageFormat {
  /** Returns the full email message data except the body */
  Metadata = 'metadata',
  /** Returns only email message ID, labels, and thread ID */
  Minimal = 'minimal',
  /** Returns the full email message data including the body */
  Full = 'full'
}

export enum MessageCategory {
  Primary = 'CATEGORY_PERSONAL',
  Social = 'CATEGORY_SOCIAL',
  Promotions = 'CATEGORY_PROMOTIONS',
  Updates = 'CATEGORY_UPDATES',
  Forums = 'CATEGORY_FORUMS'
}

export enum SystemLabel {
  Inbox = 'INBOX',
  Sent = 'SENT',
  Draft = 'DRAFT',
  Spam = 'SPAM',
  Trash = 'TRASH',
  Important = 'IMPORTANT',
  Starred = 'STARRED',
  Unread = 'UNREAD'
}

/**
 * Gmail API Interfaces
 */
export interface MessagePayloadHeader {
  name: string;
  value: string;
}

export interface MessagePayloadBody {
  /** Base64URL encoded body data */
  data?: string;
  /** Number of bytes for the entire body */
  size: number;
  /** Attachment ID if this body is an attachment */
  attachmentId?: string;
}

export interface MessagePayloadPart {
  partId: string;
  mimeType: string;
  filename?: string;
  headers: MessagePayloadHeader[];
  body: MessagePayloadBody;
  parts?: MessagePayloadPart[];
}

export interface MessagePayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: MessagePayloadHeader[];
  body: MessagePayloadBody;
  parts?: MessagePayloadPart[];
}

export interface Message {
  /** The immutable ID of the message */
  id: string;
  /** The ID of the thread the message belongs to */
  threadId: string;
  /** List of IDs of labels applied to this message */
  labelIds: string[];
  /** A short part of the message text */
  snippet: string;
  /** The ID of the last history record that modified this message */
  historyId: string;
  /** The internal message creation timestamp (epoch ms) */
  internalDate: string;
  /** The parsed email message structure */
  payload: MessagePayload;
  /** Estimated size in bytes of the message */
  sizeEstimate: number;
  /** The entire raw email message in base64url format */
  raw?: string;
}

export interface MessageList {
  /** List of messages. Note that each message contains only id and threadId */
  messages: Array<Pick<Message, 'id' | 'threadId'>>;
  /** Token to retrieve the next page of results */
  nextPageToken?: string;
  /** Estimated total number of results */
  resultSizeEstimate: number;
}

/**
 * Gmail API Request/Response Types
 */
export interface ListMessagesRequest {
  /** Maximum number of messages to return (default 100, max 500) */
  maxResults?: number;
  /** Page token from previous response */
  pageToken?: string;
  /** Gmail search query string */
  q?: string;
  /** Only return messages with these label IDs */
  labelIds?: string[];
  /** Include messages from SPAM and TRASH */
  includeSpamTrash?: boolean;
}

export interface GetMessageRequest {
  /** Message format to return */
  format?: MessageFormat;
  /** When format is METADATA, only include these headers */
  metadataHeaders?: string[];
}

export interface BatchModifyRequest {
  /** The IDs of messages to modify (max 1000) */
  ids: string[];
  /** Label IDs to add */
  addLabelIds?: string[];
  /** Label IDs to remove */
  removeLabelIds?: string[];
}

export interface BatchDeleteRequest {
  /** The IDs of messages to delete */
  ids: string[];
}

/**
 * Gmail API Client Implementation
 */
export class GmailClient {
  private baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me';
  private retryCount = 3;
  private retryDelay = 1000; // ms

  constructor(
    private accessToken: string,
    private refreshFunction: () => Promise<string>
  ) {}

  async getProfile(): Promise<{ emailAddress: string; name?: string; picture?: string }> {
    return this.fetch('/profile');
  }
  
  /**
   * Retrieves a specific message
   * @throws {GmailAPIError} On API errors
   * @throws {GmailAuthError} On authentication failures
   * @throws {GmailRateLimitError} On rate limit exceeded
   */
  async getMessage(messageId: string, options: GetMessageRequest = {}): Promise<Message> {
    const params = new URLSearchParams();
    
    if (options.format) {
      params.append('format', options.format);
    }
    
    if (options.format === MessageFormat.Metadata && options.metadataHeaders) {
      options.metadataHeaders.forEach(header => {
        params.append('metadataHeaders', header);
      });
    }

    return this.fetch(`/messages/${messageId}?${params}`);
  }

  /**
   * Lists messages matching the specified query
   * @throws {GmailAPIError} On API errors
   * @throws {GmailAuthError} On authentication failures
   * @throws {GmailRateLimitError} On rate limit exceeded
   */
  async listMessages(options: ListMessagesRequest = {}): Promise<MessageList> {
    const params = new URLSearchParams();
    
    if (options.maxResults) {
      if (options.maxResults > 500) {
        throw new Error('maxResults cannot exceed 500');
      }
      params.append('maxResults', options.maxResults.toString());
    }

    if (options.pageToken) {
      params.append('pageToken', options.pageToken);
    }

    if (options.q) {
      params.append('q', options.q);
    }

    if (options.labelIds) {
      options.labelIds.forEach(labelId => {
        params.append('labelIds', labelId);
      });
    }

    if (options.includeSpamTrash) {
      params.append('includeSpamTrash', 'true');
    }

    return this.fetch(`/messages?${params}`);
  }

  /**
   * Modifies labels on multiple messages
   * @throws {GmailAPIError} On API errors
   * @throws {GmailAuthError} On authentication failures
   * @throws {GmailRateLimitError} On rate limit exceeded
   */
  async batchModify(request: BatchModifyRequest): Promise<void> {
    if (request.ids.length > 1000) {
      throw new Error('Cannot modify more than 1000 messages at once');
    }

    await this.fetch('/messages/batchModify', {
      method: 'POST',
      body: request
    });
  }

  /**
   * Deletes multiple messages
   * Note: Provides no guarantees that messages were not already deleted or even existed
   * @throws {GmailAPIError} On API errors
   * @throws {GmailAuthError} On authentication failures
   * @throws {GmailRateLimitError} On rate limit exceeded
   */
  async batchDelete(request: BatchDeleteRequest): Promise<void> {
    await this.fetch('/messages/batchDelete', {
      method: 'POST',
      body: request
    });
  }

  /**
   * Helper method to make authenticated requests to Gmail API
   */
  private async fetch(
    endpoint: string,
    options: { method?: string; body?: any } = {}
  ): Promise<any> {
    let attempt = 0;
    
    while (attempt < this.retryCount) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: options.method || 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          ...(options.body && { body: JSON.stringify(options.body) })
        });

        if (response.ok) {
          return response.json();
        }

        if (response.status === 401) {
          // Try to refresh the access token
          this.accessToken = await this.refreshFunction();
          attempt++;
          continue;
        }

        // Handle specific error cases
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '0');
          throw new GmailRateLimitError(retryAfter);
        }

        // Parse error response
        const error = await response.json();
        throw new GmailAPIError(
          response.status,
          response.statusText,
          error.error?.code || 'unknown',
          error.error?.errors || [],
          error.error?.message || 'Unknown Gmail API error'
        );

      } catch (error) {
        // Don't retry auth errors
        if (error instanceof GmailAuthError) {
          throw error;
        }

        // Handle rate limiting with exponential backoff
        if (error instanceof GmailRateLimitError) {
          if (attempt < this.retryCount) {
            const delay = error.retryAfter 
              ? error.retryAfter * 1000
              : Math.min(this.retryDelay * Math.pow(2, attempt), 64000);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
        }

        throw error;
      }
    }
  }
}