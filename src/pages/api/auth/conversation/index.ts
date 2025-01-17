import { NextApiRequest, NextApiResponse } from 'next';
import { ConversationService } from '../../../lib/agents/controller/ConversationService';

const conversationService = new ConversationService();

export default async function handler(
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
    const response = await conversationService.handleUserMessage(message);
    res.status(200).json({ response });
  } catch (error) {
    console.error('Error handling conversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}