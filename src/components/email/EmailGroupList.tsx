import React, { useState, useEffect } from 'react';
import { SimpleEmail, SimpleEmailManager } from '@/lib/api/SimpleEmailManager';
import { EmailGroupView } from './EmailGroupView';
import { AlertCircle } from 'lucide-react';

// ... rest of the file remains the same ...
interface EmailGroupListProps {
  emailManager: SimpleEmailManager;
}

export const EmailGroupList: React.FC<EmailGroupListProps> = ({ emailManager }) => {
  const [groups, setGroups] = useState<Map<string, SimpleEmail[]>>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadEmailGroups();
  }, []);

  const loadEmailGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const groupedEmails = await emailManager.groupBySender();
      setGroups(groupedEmails);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load emails'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSender = async (senderEmail: string) => {
    try {
      await emailManager.deleteFromSender(senderEmail);
      // Refresh the groups after deletion
      await loadEmailGroups();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete emails'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-600">{error.message}</span>
      </div>
    );
  }

  if (!groups || groups.size === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No emails found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([senderEmail, emails]) => (
        <EmailGroupView
          key={senderEmail}
          senderEmail={senderEmail}
          emails={emails}
          onDeleteSender={handleDeleteSender}
        />
      ))}
    </div>
  );
};