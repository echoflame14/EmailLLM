import { EmailTools } from '@/lib/tools/email/emailTools';
import { AuthSession } from '@/lib/auth/types';

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface EmailOperationHandlers {
  analyzePatternsHandler: () => Promise<OperationResult<any>>;
  createLabelHandler: (name: string) => Promise<OperationResult<string>>;
  applyLabelsHandler: (query: string, labels: string[]) => Promise<OperationResult<number>>;
  getMetadataHandler: (messageId: string) => Promise<OperationResult<any>>;
}

export function createEmailOperationHandlers(session: AuthSession): EmailOperationHandlers {
  const emailTools = new EmailTools(session.tokens.access_token);

  return {
    /**
     * Analyze email patterns
     * Returns patterns of senders, subjects, and their frequencies
     */
    analyzePatternsHandler: async () => {
      try {
        const patterns = await emailTools.analyzeEmailPatterns();
        return {
          success: true,
          data: patterns
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze patterns'
        };
      }
    },

    /**
     * Create or get a label
     * Returns the label ID
     */
    createLabelHandler: async (name: string) => {
      try {
        const labelId = await emailTools.getOrCreateLabel(name);
        return {
          success: true,
          data: labelId
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create/get label'
        };
      }
    },

    /**
     * Apply labels to messages matching a query
     * Returns the number of messages labeled
     */
    applyLabelsHandler: async (query: string, labels: string[]) => {
      try {
        const count = await emailTools.applyLabelsToMatching(query, labels);
        return {
          success: true,
          data: count
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to apply labels'
        };
      }
    },

    /**
     * Get metadata for a specific email
     * Returns formatted email metadata
     */
    getMetadataHandler: async (messageId: string) => {
      try {
        const metadata = await emailTools.getEmailMetadata(messageId);
        return {
          success: true,
          data: metadata
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get email metadata'
        };
      }
    }
  };
}

// Helper type for describing available operations to the LLM
export const EMAIL_OPERATIONS = {
  ANALYZE_PATTERNS: {
    name: 'analyzePatternsHandler',
    description: 'Analyze email patterns to identify frequent senders and categories',
    parameters: []
  },
  CREATE_LABEL: {
    name: 'createLabelHandler',
    description: 'Create a new label or get existing one',
    parameters: ['name: string - The name of the label to create']
  },
  APPLY_LABELS: {
    name: 'applyLabelsHandler',
    description: 'Apply labels to emails matching a search query',
    parameters: [
      'query: string - Gmail search query',
      'labels: string[] - Array of label names to apply'
    ]
  },
  GET_METADATA: {
    name: 'getMetadataHandler',
    description: 'Get metadata for a specific email',
    parameters: ['messageId: string - The ID of the email']
  }
} as const;