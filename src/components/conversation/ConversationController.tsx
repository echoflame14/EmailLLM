// File: analyze/emailLLM/email-assistant/src/components/conversation/ConversationController.tsx
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { executeEmailTool, ToolCall } from '@/lib/api/toolHandler';
import { SimpleEmailManager } from '@/lib/api/SimpleEmailManager';
import { EmailSummaries } from '../email/EmailSummaries'; // Import the EmailSummaries component

interface ContentBlock {
  type: string;
  text?: string;
  content?: string;
}

interface TextBlock extends ContentBlock {
  type: 'text';
  text: string;
}

interface ToolUseBlock extends ContentBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResultBlock extends ContentBlock {
  type: 'tool_result';
  tool_use_id: string;
  content?: string;
}

type MessageContent = TextBlock | ToolUseBlock | ToolResultBlock;

interface Message {
  role: 'user' | 'assistant';
  content: MessageContent[];
}

interface ConversationControllerProps {
  emailManager: SimpleEmailManager;
}

const ConversationController: React.FC<ConversationControllerProps> = ({ emailManager }) => {
  const { refreshToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeAuthenticatedRequest = async (url: string, payload: any) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        await refreshToken();
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData?.message || `API request failed after token refresh: ${retryResponse.status}`);
        }
        return retryResponse;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || `API request failed: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
  
    const userMessage: Message = {
      role: 'user',
      content: [{
        type: 'text',
        text: input
      }]
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
  
    try {
      const payload = {
        messages: [...messages, userMessage]
      };
  
      const response = await makeAuthenticatedRequest('/api/chat', payload);
      const data = await response.json();
  
      if (data.needsTool) {
        if (data.toolError) {
          const errorMessage: Message = {
            role: 'assistant',
            content: [{
              type: 'text',
              text: `Error executing tool: ${data.toolError}`
            }]
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
  
        // Add Claude's tool use message
        const assistantMessage: Message = {
          role: 'assistant',
          content: [{
            type: 'tool_use',
            id: data.toolCall.id,
            name: data.toolCall.name,
            input: data.toolCall.parameters
          }]
        };
        setMessages(prev => [...prev, assistantMessage]);
  
        // Execute the tool
        let toolResult;
        try {
          toolResult = await executeEmailTool(
            data.toolCall.name,
            data.toolCall.parameters,
            emailManager
          );
        } catch (err) {
          console.error('Tool execution error:', err);
          const errorMessage: Message = {
            role: 'assistant',
            content: [{
              type: 'text',
              text: `Error executing tool: ${err instanceof Error ? err.message : String(err)}`
            }]
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
  
        // Add tool result message
        const toolResultMessage: Message = {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: data.toolCall.id,
            content: JSON.stringify(toolResult)
          }]
        };
        setMessages(prev => [...prev, toolResultMessage]);
  
        // Get final response from Claude
        const followUpPayload = {
          messages: [...messages, userMessage, assistantMessage, toolResultMessage],
          toolResults: {
            id: data.toolCall.id,
            result: toolResult
          }
        };
  
        const finalResponse = await makeAuthenticatedRequest('/api/chat', followUpPayload);
        const finalData = await finalResponse.json();
  
        const finalAssistantMessage: Message = {
          role: 'assistant',
          content: [{
            type: 'text',
            text: finalData.response || 'No response received'
          }]
        };
        setMessages(prev => [...prev, finalAssistantMessage]);
  
      } else {
        // Handle normal response without tool use
        const assistantMessage: Message = {
          role: 'assistant',
          content: [{
            type: 'text',
            text: data.response || 'No response received'
          }]
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-lg shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isToolResult = msg.content[0]?.type === 'tool_result';
          
          return (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? isToolResult 
                    ? 'bg-gray-100 max-w-[80%]'  // Tool results
                    : 'bg-blue-100 ml-auto max-w-[80%]'  // User messages
                  : 'bg-gray-100 mr-auto max-w-[80%]'  // Assistant messages
              }`}
            >
              <div className="font-semibold mb-1">
                {msg.role === 'user' 
                  ? isToolResult 
                    ? 'Tool Result' 
                    : 'You'
                  : 'Assistant'}
              </div>
              <div className="whitespace-pre-wrap break-words">
                {msg.content.map((block, blockIndex) => {
                  if (block.type === 'text' && block.text) {
                    return <div key={blockIndex}>{block.text}</div>;
                  }
                  if (block.type === 'tool_result' && block.content) {
                    // Attempt to parse the tool_result content as JSON
                    let parsedEmails = null;
                    try {
                      parsedEmails = JSON.parse(block.content);
                    } catch (e) {
                      console.error("Error parsing tool_result JSON:", e);
                    }
                    if (
                      parsedEmails &&
                      Array.isArray(parsedEmails) &&
                      parsedEmails.length > 0 &&
                      parsedEmails[0].id
                    ) {
                      // Render the EmailSummaries component if the JSON structure matches expected emails
                      return <EmailSummaries emails={parsedEmails} key={blockIndex} />;
                    }
                    // Fallback to displaying raw content if not valid JSON
                    return <div key={blockIndex}>{block.content}</div>;
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}
        {error && (
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </div>
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your emails..."
            className="flex-1 p-2 border rounded-lg resize-none h-[60px]"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationController;
