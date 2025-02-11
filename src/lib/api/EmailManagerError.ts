export class EmailManagerError extends Error {
    constructor(message: string, public cause?: Error) {
      super(message);
      this.name = 'EmailManagerError';
    }
  }
  