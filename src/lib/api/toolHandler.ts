import { SimpleEmailManager } from './SimpleEmailManager';

// Base content block interface
interface BaseContentBlock {
  type: string;
}

// Text content block
interface TextContentBlock extends BaseContentBlock {
  type: 'text';
  text: string;
}

// Tool use content block
interface ToolUseContentBlock extends BaseContentBlock {
  type: 'tool_use';
  tool_calls: ToolCall[];
}

// Tool result content block
interface ToolResultBlock extends BaseContentBlock {
  type: 'tool_result';
  tool_use_id: string;
  content?: string;
}

// Union type for all possible content blocks
export type ContentBlock = TextContentBlock | ToolUseContentBlock | ToolResultBlock;

// Tool call interface
export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

// Tool use content interface
export interface ToolUseContent extends BaseContentBlock {
  type: 'tool_use';
  tool_calls: ToolCall[];
}

// Type guard for tool use content
export function isToolUseContent(content: ContentBlock): content is ToolUseContent {
  return content.type === 'tool_use' && 'tool_calls' in content;
}

// Tool execution function
export async function executeEmailTool(
  toolName: string,
  params: any,
  emailManager: SimpleEmailManager
): Promise<any> {
  switch (toolName) {
    case 'get_recent_emails':
      return await emailManager.getRecentEmails(params.limit || 10);
      
    case 'delete_sender_emails':
      return await emailManager.deleteFromSender(params.senderEmail);
      
    case 'group_by_sender':
      return await emailManager.groupBySender();
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}