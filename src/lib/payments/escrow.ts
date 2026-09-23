export interface EscrowGateway {
  holdFunds(transactionId: string, amount: number, payerId: string, payeeId: string): Promise<boolean>;
  releaseFunds(transactionId: string): Promise<boolean>;
  refund(transactionId: string): Promise<boolean>;
}

export class MockEscrowProvider implements EscrowGateway {
  async holdFunds(transactionId: string, amount: number, payerId: string, payeeId: string): Promise<boolean> {
    console.log(`[MockEscrow] Holding funds for Tx: ${transactionId} | Amount: ${amount} | From: ${payerId} | To: ${payeeId}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[MockEscrow] Funds held successfully for Tx: ${transactionId}`);
        resolve(true);
      }, 1000); // Simulate 1 second network delay
    });
  }

  async releaseFunds(transactionId: string): Promise<boolean> {
    console.log(`[MockEscrow] Releasing funds for Tx: ${transactionId}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[MockEscrow] Funds released successfully for Tx: ${transactionId}`);
        resolve(true);
      }, 1000);
    });
  }

  async refund(transactionId: string): Promise<boolean> {
    console.log(`[MockEscrow] Refunding Tx: ${transactionId}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[MockEscrow] Refund successful for Tx: ${transactionId}`);
        resolve(true);
      }, 1000);
    });
  }
}
