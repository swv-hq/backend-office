export interface CreateConnectExpressAccountInput {
  email: string;
  country?: string;
}

export interface CreateConnectAccountResult {
  accountId: string;
  accountType: "express" | "standard";
}

export interface LinkConnectStandardAccountInput {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

export interface LinkConnectStandardAccountResult {
  url: string;
  expiresAt: number;
}

export interface CreateCheckoutSessionInput {
  amount: number;
  currency: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  connectedAccountId?: string;
  applicationFeeAmount?: number;
  customerId?: string;
}

export interface CreateCheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface HandlePaymentWebhookInput {
  rawBody: string;
  signatureHeader: string;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export interface CreateSubscriptionInput {
  customerId: string;
  priceId: string;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  status: string;
  currentPeriodEnd?: number;
}

export interface ChargeSubscriptionInput {
  customerId: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface ChargeSubscriptionResult {
  paymentIntentId: string;
  status: string;
}

export interface PaymentsProvider {
  createConnectExpressAccount(
    input: CreateConnectExpressAccountInput,
  ): Promise<CreateConnectAccountResult>;
  linkConnectStandardAccount(
    input: LinkConnectStandardAccountInput,
  ): Promise<LinkConnectStandardAccountResult>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult>;
  handlePaymentWebhook(
    input: HandlePaymentWebhookInput,
  ): Promise<PaymentWebhookEvent>;
  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionResult>;
  chargeSubscription(
    input: ChargeSubscriptionInput,
  ): Promise<ChargeSubscriptionResult>;
}
