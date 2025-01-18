📧 Email Assistant

A sophisticated email management system built with Next.js that leverages AI to help users intelligently organize and manage their Gmail inbox.
🌟 Features

    📊 Smart Email Analysis: Analyzes email patterns to identify frequent senders and categories.

    🗂️ Intelligent Organization: Creates and manages labels based on user communication patterns.

    🔒 Secure Authentication: Implements Google OAuth 2.0 for secure Gmail access.

    🔄 Real-time Updates: Maintains session state and automatically refreshes tokens.

    📱 Responsive UI: Clean, modern interface built with Tailwind CSS.

    🤖 AI-Powered Chat Interface: Interactive conversation system for email management.

    🔍 Pattern Recognition: Advanced email pattern analysis and categorization.

    🎨 Custom UI Components: Responsive design with loading states and error boundaries.

    🔐 Secure Token Management: Automatic token refresh and secure session handling.

🔧 Tech Stack

    Frontend: Next.js, React, TypeScript

    Styling: Tailwind CSS

    Authentication: Google OAuth 2.0

    AI Integration: Claude 3 Sonnet (Anthropic)

    Testing: Jest

    API Integration: Gmail API

🏗️ Technical Architecture
Frontend Components

    EmailAssistant: Main application shell with error boundary and loading states.

    ConversationController: AI-powered chat interface for email management.

    AuthStatus: Authentication state management.

    GoogleAuthButton: OAuth2.0 authentication flow.

API Integration
Gmail Client
typescript
Copy

class GmailClient {
  // Core Gmail API operations
  async getProfile();
  async listMessages(query?: string, maxResults = 100);
  async getMessage(messageId: string, format: 'full' | 'metadata' | 'minimal');
  async listLabels();
  async createLabel(name: string, visibility: string);
}

Email Tools
typescript
Copy

interface EmailPattern {
  type: 'sender' | 'subject' | 'content';
  value: string;
  frequency: number;
  labels: string[];
}

class EmailTools {
  async analyzeEmailPatterns(maxEmails: number): Promise<EmailPattern[]>;
  // Pattern recognition and email organization
}

Authentication Configuration
typescript
Copy

const AUTH_CONFIG = {
  scopes: [
    'gmail.modify',
    'gmail.labels',
    'gmail.metadata',
    'userinfo.email',
    'userinfo.profile'
  ],
  accessType: 'offline',
  prompt: 'consent'
};

Required Google OAuth2.0 Scopes

    gmail.modify: Email modification permissions.

    gmail.labels: Label management.

    gmail.metadata: Email metadata access.

    userinfo.email: User email access.

    userinfo.profile: Basic profile information.

🚀 Getting Started
Prerequisites

    Node.js (v14 or higher)

    npm or yarn

    Google Cloud Platform account with Gmail API enabled

    Anthropic API key for Claude integration

Installation

    Clone the repository:
    bash
    Copy

    git clone <repository-url>
    cd email-assistant

    Install dependencies:
    bash
    Copy

    npm install

    Create a .env.local file with the following variables:
    env
    Copy

    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ANTHROPIC_API_KEY=your_anthropic_api_key
    SECRET_COOKIE_PASSWORD=your_cookie_secret

    Run the development server:
    bash
    Copy

    npm run dev

🏗️ Project Structure
Copy

email-assistant/
├── src/
│   ├── components/       # React components
│   │   ├── email/        # Email-related components
│   │   │   └── EmailAssistant.tsx # Main application component
│   │   └── auth/         # Authentication components
│   │       └── GoogleAuthButton.tsx # Authentication button
│   ├── lib/              # Core functionality
│   │   ├── api/          # API clients
│   │   │   └── gmail.ts  # Gmail API client
│   │   ├── tools/        # Utility functions
│   │   │   └── email/    # Email analysis tools
│   │   │       └── emailTools.ts # Email pattern analysis
│   │   └── auth/         # Authentication
│   │       └── session.ts # Session management
│   └── pages/            # Next.js pages
├── public/               # Static assets
└── tests/                # Test files

🔒 Authentication Flow

The application uses Google OAuth 2.0 for authentication with the following flow:

    User initiates login through the Google Auth Button.

    OAuth consent screen requests necessary Gmail permissions.

    Callback handler processes the authentication code.

    Session management with secure HTTP-only cookies.

    Automatic token refresh when expired.

🤖 AI Integration

The email assistant uses Claude 3 Sonnet for intelligent email management:

    Pattern analysis in email communications.

    Smart label suggestions.

    Natural language processing for user commands.

    Contextual responses based on email content.

🧪 Testing

Run the test suite:
bash
Copy

npm test          # Run tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report

📚 API Documentation
Core Operations

    Email Pattern Analysis

        Analyzes communication patterns.

        Identifies frequent senders.

        Suggests organization strategies.

    Label Management

        Creates intelligent labels.

        Applies labels based on patterns.

        Manages label hierarchies.

    Email Metadata

        Retrieves detailed email information.

        Processes email threads.

        Manages email categorization.

Available Operations
typescript
Copy

const EMAIL_OPERATIONS = {
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
};

🛠️ Development
Scripts
json
Copy

{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}

Error Handling

The application includes comprehensive error boundaries and loading states:

    Authentication errors.

    API rate limiting.

    Network failures.

    Session expiration.

🤝 Contributing

    Fork the repository.

    Create a feature branch (git checkout -b feature/amazing-feature).

    Commit your changes (git commit -m 'Add some amazing feature').

    Push to the branch (git push origin feature/amazing-feature).

    Open a Pull Request.

Contribution Guidelines

    Write clear, descriptive commit messages.

    Update documentation as needed.

    Add tests for new features.

    Follow existing code style and conventions.

    Update the README with any necessary changes.

📄 License

This project is licensed under the ISC License - see the LICENSE file for details.
🙏 Acknowledgments

    Google Gmail API

    Anthropic's Claude AI

    Next.js team

    Tailwind CSS community

⚠️ Important Notes

    Ensure proper error handling for API rate limits.

    Keep authentication tokens secure.

    Follow Gmail API usage guidelines.

    Regularly test the token refresh mechanism.

🔍 Troubleshooting
Common Issues

    Authentication Errors

        Verify Google OAuth credentials.

        Check token refresh mechanism.

        Ensure correct scopes are requested.

    API Rate Limits

        Implement proper rate limiting.

        Add retry mechanisms.

        Cache responses where appropriate.

    Performance Issues

        Optimize API calls.

        Implement proper caching.

        Monitor memory usage.

📞 Support

For support, please:

    Check the documentation.

    Search existing issues.

    Create a new issue with:

        Detailed description.

        Steps to reproduce.

        Expected vs actual behavior.

🔮 Future Enhancements

    Enhanced pattern recognition.

    Advanced label management.

    Improved AI interactions.

    Additional email providers.

    Mobile application.