import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from "../generated/prisma/enums";

export type NotificationWithUser = {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  deliveryStatus: NotificationDeliveryStatus;
  retryCount: number;
  user: {
    id: string;
    email: string;
    phone: string | null;
    fullName: string | null;
  };
};

export type NotificationTemplateContextValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type NotificationTemplateContext = Record<
  string,
  NotificationTemplateContextValue
>;

export type TwilioClient = {
  messages: {
    create(params: {
      body: string;
      from: string;
      to: string;
    }): Promise<unknown>;
  };
};

export type TwilioFactory = (
  accountSid: string,
  authToken: string,
) => TwilioClient;
