import React, { useState } from 'react';
import { SimpleEmail } from '@/lib/api/SimpleEmailManager';
import { Trash2, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface EmailGroupViewProps {
  senderEmail: string;
  emails: SimpleEmail[];
  onDeleteSender: (email: string) => Promise<void>;
}

export const EmailGroupView: React.FC<EmailGroupViewProps> = ({
  senderEmail,
  emails,
  onDeleteSender,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteSender(senderEmail);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900">
              {emails[0].sender.name || senderEmail}
            </h3>
            <p className="text-sm text-gray-500">{emails.length} emails</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="p-2 hover:bg-red-100 rounded-full text-red-600"
            disabled={isDeleting}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {emails.map((email) => (
            <div key={email.id} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between">
                <h4 className="font-medium">{email.subject}</h4>
                <span className="text-sm text-gray-500">
                  {email.date.toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{email.snippet}</p>
            </div>
          ))}
        </div>
      )}

      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 max-w-md w-full">
            <AlertDialog.Title className="text-lg font-medium text-gray-900">
              Delete all emails from this sender?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-gray-600">
              This will permanently delete {emails.length} emails from{' '}
              {emails[0].sender.name || senderEmail}. This action cannot be undone.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end space-x-3">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete All'}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
};