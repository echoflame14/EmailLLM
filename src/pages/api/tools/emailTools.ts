// Define our own Tool interface based on Anthropic's schema
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const emailTools: Tool[] = [
  {
    name: "get_recent_emails",
    description: "Retrieves the most recent emails from the user's inbox. Limited to 10 emails maximum for performance reasons. Returns an array of emails with sender, subject, and date information.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of recent emails to fetch (max 10)",
          maximum: 10,
          minimum: 1,
          default: 10
        }
      }
    }
  },
  {
    name: "delete_sender_emails",
    description: "Deletes all emails from a specific sender. This is a permanent action and cannot be undone. Returns the number of emails deleted.",
    parameters: {
      type: "object",
      properties: {
        senderEmail: {
          type: "string",
          description: "Email address of the sender whose emails should be deleted"
        }
      },
      required: ["senderEmail"]
    }
  },
  {
    name: "group_by_sender",
    description: "Groups recent emails by sender, showing how many emails came from each sender. This helps identify patterns in email communication.",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

export const systemPrompt = `You are an email management assistant that can help users organize and manage their inbox.
You have access to several email management tools that you can use to help users:
- get_recent_emails: View the most recent emails
- delete_sender_emails: Remove all emails from a specific sender
- group_by_sender: See email patterns grouped by sender

Always confirm before taking destructive actions like deleting emails.
When users ask about their emails, first check what they have using get_recent_emails or group_by_sender before suggesting any actions.`;