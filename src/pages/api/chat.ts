import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/auth/session';
import { emailTools, systemPrompt } from './tools/emailTools';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== Starting request handler ===');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session?.auth?.tokens?.access_token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let { messages } = req.body;
    const { toolResult } = req.body;

    if (toolResult) {
      console.log('=== Processing Tool Result ===');
      console.log('Tool Result:', JSON.stringify(toolResult, null, 2));

      // Create tool result content block
      const toolResultBlock = {
        type: 'tool_result' as const,
        tool_call_id: toolResult.id,
        content: toolResult.content || JSON.stringify(toolResult)
      };

      // Add tool result as content block in new user message
      messages.push({
        role: 'user',
        content: [toolResultBlock]
      });
      
      // Add tool result as a new user message
      const toolResultMessage: MessageParam = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Tool result received: ${toolResult.content || JSON.stringify(toolResult)}`,
          },
        ],
      };

      messages.push(toolResultMessage);

      console.log('=== Processed Messages ===');
      console.log('Messages after processing:', JSON.stringify(messages, null, 2));
    }

    console.log('=== Sending Messages to Claude ===');
    console.log('Messages:', JSON.stringify(messages, null, 2));

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: emailTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: {
          type: 'object',
          properties: tool.parameters.properties,
          required: tool.parameters.required,
        },
      })),
      tool_choice: { type: 'auto' },
    });

    if (claudeResponse.stop_reason === 'tool_use') {
      const toolUseBlock = claudeResponse.content.find(
        (block) => block.type === 'tool_use'
      );

      if (toolUseBlock) {
        console.log('=== Tool Use Detected ===');
        const textBlock = claudeResponse.content.find(
          (block) => block.type === 'text'
        );

        return res.status(200).json({
          response: textBlock?.type === 'text' ? textBlock.text : '',
          toolCall: {
            id: toolUseBlock.id,
            name: toolUseBlock.name,
            parameters: toolUseBlock.input,
          },
          needsTool: true,
        });
      }
    }

    const textBlock = claudeResponse.content.find((block) => block.type === 'text');
    if (textBlock) {
      return res.status(200).json({
        response: textBlock.text,
        needsTool: false,
      });
    }

    return res.status(200).json({
      response: 'No response received',
      needsTool: false,
    });
  } catch (error) {
    console.error('=== Error in chat endpoint ===');
    console.error('Error details:', error);
    return res.status(500).json({
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
