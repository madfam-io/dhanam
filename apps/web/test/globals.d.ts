declare global {
  var testUtils: {
    createMockUser: () => {
      id: string;
      email: string;
      name: string;
      locale: string;
      timezone: string;
    };
    createMockSpace: () => {
      id: string;
      name: string;
      type: string;
      currency: string;
      timezone: string;
    };
    createMockAccount: () => {
      id: string;
      name: string;
      type: string;
      provider: string;
      currency: string;
      balance: number;
      lastSyncedAt: string;
    };
    createMockTransaction: () => {
      id: string;
      accountId: string;
      amount: number;
      currency: string;
      description: string;
      date: string;
    };
  };
}

export {};