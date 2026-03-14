declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      subscriptionTier?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
