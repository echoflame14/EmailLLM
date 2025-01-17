// src/lib/api/gmail.ts

import { GoogleTokens } from '../auth/types';

export class GmailClient {
  private accessToken: string;
  private baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user profile
  async getProfile() {
    return this.fetch('/profile');
  }

  // List messages with optional query
  async listMessages(query: string = '', maxResults: number = 100) {
    return this.fetch(`/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);
  }

  // Get message details
  async getMessage(messageId: string, format: 'full' | 'metadata' | 'minimal' = 'full') {
    return this.fetch(`/messages/${messageId}?format=${format}`);
  }

  // List labels
  async listLabels() {
    return this.fetch('/labels');
  }

  // Create new label
  async createLabel(name: string, labelListVisibility = 'labelShow', messageListVisibility = 'show') {
    return this.fetch('/labels', {
      method: 'POST',
      body: JSON.stringify({
        name,
        labelListVisibility,
        messageListVisibility,
      }),
    });
  }

  // Modify message labels
  async modifyLabels(messageId: string, addLabelIds: string[] = [], removeLabelIds: string[] = []) {
    return this.fetch(`/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds,
        removeLabelIds,
      }),
    });
  }

  // Batch modify messages
  async batchModifyMessages(messageIds: string[], addLabelIds: string[] = [], removeLabelIds: string[] = []) {
    return this.fetch('/messages/batchModify', {
      method: 'POST',
      body: JSON.stringify({
        ids: messageIds,
        addLabelIds,
        removeLabelIds,
      }),
    });
  }
}