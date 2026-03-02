export interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatEvent;
}

export interface RevenueCatEvent {
  type: RevenueCatEventType;
  app_user_id: string;
  product_id: string;
  original_transaction_id: string;
  store: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
}

export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'UNCANCELLATION'
  | 'TRANSFER';
