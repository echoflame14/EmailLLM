import { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { ConversationService } from '@/lib/agents/controller/conversationService';
import Anthropic from '@anthropic-ai/sdk';
import { SessionData } from '@/lib/auth/session';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt teaching Claude about the available email operations
const EMAIL_SYSTEM_PROMPT = `You are an email management assistant with access to the following operations:

1. analyzePatternsHandler: Analyze email patterns to identify frequent senders and categories
2. createLabelHandler: Create a new label or get an existing one
3. applyLabelsHandler: Apply labels to emails matching a search query
4. getMetadataHandler: Get metadata for a specific email

When users ask about email organization, you should:
1. First analyze their patterns using analyzePatternsHandler
2. Make suggestions based on the patterns you find
3. Create labels and organize emails only with user confirmation
4. Always explain what you're doing and why

Keep responses clear and concise. Always get user confirmation before making changes.`;

const sessionOptions = {
  cookieName: "email-assistant-session",
  password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    // Get the session
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    // Initialize conversation service with user's session
    const conversationService = new ConversationService(session.auth || null);

    // First, let Claude interpret the user's intent
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: EMAIL_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: message
      }]
    });

    // Get Claude's response
    const claudeContent = claudeResponse.content[0];
    let claudeMessage = '';
    
    if ('text' in claudeContent) {
      claudeMessage = claudeContent.text;
    } else {
      // Handle other content types if needed
      claudeMessage = 'Unable to process response format';
    }

    // Process the message through our conversation service
    const operationResult = await conversationService.handleUserMessage(message);

    // Send both the LLM's interpretation and the operation result
    res.status(200).json({ 
      response: `${claudeMessage}\n\n${operationResult}`,
      operation: operationResult
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default handler;