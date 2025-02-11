export interface SimpleEmail {
    id: string;
    threadId: string;
    subject: string;
    snippet?: string;
    date: Date;
    sender: {
      name?: string;
      email: string;
    };
  }
  