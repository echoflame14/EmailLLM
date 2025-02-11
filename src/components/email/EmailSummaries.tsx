// File: src/components/email/EmailSummaries.tsx
import React from 'react';

interface Email {
  id: string;
  threadId: string;
  subject: string;
  date: string; // ISO string format
  sender: {
    name: string;
    email: string;
  };
}

interface EmailSummariesProps {
  emails: Email[];
}

export const EmailSummaries: React.FC<EmailSummariesProps> = ({ emails }) => {
  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <div key={email.id} className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-bold text-lg">{email.subject}</h3>
          <p className="text-gray-500">
            {new Date(email.date).toLocaleString()}
          </p>
          <p className="text-sm text-gray-700">
            From: {email.sender.name} ({email.sender.email})
          </p>
        </div>
      ))}
    </div>
  );
};
