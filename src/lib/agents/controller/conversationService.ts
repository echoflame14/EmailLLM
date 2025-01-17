import { AuthSession } from '@/lib/auth/types';
import { createEmailOperationHandlers, EmailOperationHandlers, EMAIL_OPERATIONS } from '../operational/handlers';

interface ConversationState {
  stage: string;
  context: Record<string, any>;
  handlers: EmailOperationHandlers | null;
}

export class ConversationService {
  private state: ConversationState = {
    stage: 'INITIAL',
    context: {},
    handlers: null
  };

  private stages = {
    INITIAL: 'INITIAL',
    ANALYZING: 'ANALYZING',
    ORGANIZING: 'ORGANIZING',
    CONFIRMING: 'CONFIRMING',
    ERROR: 'ERROR'
  };

  constructor(private session: AuthSession | null = null) {
    if (session) {
      this.initializeHandlers(session);
    }
  }

  private initializeHandlers(session: AuthSession) {
    this.state.handlers = createEmailOperationHandlers(session);
  }

  async handleUserMessage(message: string): Promise<string> {
    if (!this.state.handlers) {
      return "I'm not properly initialized with email access. Please ensure you're logged in.";
    }

    try {
      switch (this.state.stage) {
        case this.stages.INITIAL:
          // Start the email analysis process
          this.state.stage = this.stages.ANALYZING;
          const patterns = await this.state.handlers.analyzePatternsHandler();
          
          if (!patterns.success) {
            throw new Error(patterns.error);
          }

          this.state.context.patterns = patterns.data;
          return this.generateAnalysisResponse(patterns.data);

        case this.stages.ANALYZING:
          // Process user's response to analysis and suggest organization
          this.state.stage = this.stages.ORGANIZING;
          return this.handleAnalysisResponse(message);

        case this.stages.ORGANIZING:
          // Handle organization confirmation
          this.state.stage = this.stages.CONFIRMING;
          return this.handleOrganizationRequest(message);

        case this.stages.CONFIRMING:
          // Apply confirmed changes
          return this.handleConfirmation(message);

        case this.stages.ERROR:
          // Reset state and start over
          this.state.stage = this.stages.INITIAL;
          this.state.context = {};
          return "I encountered an error earlier. Let's start fresh. Would you like me to analyze your email patterns?";

        default:
          return "I'm not sure what to do next. Would you like me to analyze your emails?";
      }
    } catch (error) {
      this.state.stage = this.stages.ERROR;
      return `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Let's try again.`;
    }
  }

  private generateAnalysisResponse(patterns: any[]): string {
    // Convert analysis into human-readable format
    const topSenders = patterns.slice(0, 5)
      .map(p => `- ${p.value} (${p.frequency} emails)`)
      .join('\n');

    return `I've analyzed your email patterns. Here are your top senders:\n${topSenders}\n\nWould you like me to suggest an organization system based on these patterns?`;
  }

  private async handleAnalysisResponse(message: string): Promise<string> {
    if (message.toLowerCase().includes('yes')) {
      const suggestions = this.generateOrganizationSuggestions(this.state.context.patterns);
      this.state.context.suggestions = suggestions;
      
      return `Based on your email patterns, I suggest creating these labels:\n${
        suggestions.map(s => `- ${s.name}: ${s.description}`).join('\n')
      }\n\nWould you like me to create these labels and organize your emails?`;
    }
    
    return "Would you like to try a different organization approach?";
  }

  private generateOrganizationSuggestions(patterns: any[]) {
    return patterns
      .filter(p => p.frequency > 10)
      .map(p => ({
        name: this.generateLabelName(p.value),
        description: `For emails from ${p.value}`,
        query: `from:${p.value}`
      }));
  }

  private generateLabelName(sender: string): string {
    // Convert email or name into a valid label name
    return sender
      .split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 40);
  }

  private async handleOrganizationRequest(message: string): Promise<string> {
    if (!message.toLowerCase().includes('yes')) {
      this.state.stage = this.stages.INITIAL;
      return "No problem. What would you like to do instead?";
    }

    const { suggestions } = this.state.context;
    const results = await Promise.all(
      suggestions.map(async (suggestion: any) => {
        const labelResult = await this.state.handlers!.createLabelHandler(suggestion.name);
        if (labelResult.success) {
          return {
            name: suggestion.name,
            success: true
          };
        }
        return {
          name: suggestion.name,
          success: false,
          error: labelResult.error
        };
      })
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    this.state.context.createdLabels = successful;

    return `I've created ${successful.length} labels.${
      failed.length ? ` (${failed.length} failed)` : ''
    }\n\nWould you like me to start organizing your emails into these labels?`;
  }

  private async handleConfirmation(message: string): Promise<string> {
    if (!message.toLowerCase().includes('yes')) {
      this.state.stage = this.stages.INITIAL;
      return "Okay, I won't organize the emails. What would you like to do instead?";
    }

    const { suggestions, createdLabels } = this.state.context;
    const labelNames = createdLabels.map((l: any) => l.name);

    let totalOrganized = 0;
    for (const suggestion of suggestions) {
      if (labelNames.includes(suggestion.name)) {
        const result = await this.state.handlers!.applyLabelsHandler(
          suggestion.query,
          [suggestion.name]
        );
        if (result.success) {
          totalOrganized += result.data || 0;
        }
      }
    }

    this.state.stage = this.stages.INITIAL;
    this.state.context = {};

    return `I've organized ${totalOrganized} emails into their respective labels. Is there anything else you'd like me to help you with?`;
  }
}