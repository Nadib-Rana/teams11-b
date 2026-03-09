import { MailerOptions } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { ConfigService } from "@nestjs/config";
import { join } from "path";

/**
 * NestJS MailerModule-এর জন্য কনফিগারেশন ফাংশন।
 * এটি ConfigService থেকে এনভায়রনমেন্ট ভেরিয়েবলগুলো নিয়ে MailerOptions রিটার্ন করে।
 */
export const getMailConfig = (configService: ConfigService): MailerOptions => {
  return {
    transport: {
      host: configService.get<string>("MAIL_HOST"),
      port: configService.get<number>("MAIL_PORT"),
      secure: false, // Mailtrap বা ডেভেলপমেন্টের জন্য সাধারণত false থাকে
      auth: {
        user: configService.get<string>("MAIL_USER"),
        pass: configService.get<string>("MAIL_PASS"),
      },
    },

    defaults: {
      from: `"Atech Support" <${configService.get<string>("MAIL_FROM")}>`,
    },
    template: {
      // process.cwd() ব্যবহার করলে এটি প্রজেক্টের রুট ডিরেক্টরিতে 'templates' ফোল্ডার খুঁজবে
      dir: join(process.cwd(), "templates"),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  };
};
