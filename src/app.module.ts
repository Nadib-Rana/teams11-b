import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ContextModule } from "./common/context/context.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { ResponseStandardizationInterceptor } from "./common/interceptors/response-standardization.interceptor";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getMailConfig } from "./mail/mail.config";
import { MailerModule } from "@nestjs-modules/mailer";
import { BusinessModule } from "./business/business.module";
import { StaffModule } from "./staff/staff.module";
import { ServiceModule } from "./service/service.module";
import { BookingModule } from "./booking/booking.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MailerModule.forRootAsync({
      useFactory: getMailConfig,
      inject: [ConfigService],
    }),
    ContextModule,
    AuthModule,
    BusinessModule,
    StaffModule,
    ServiceModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseStandardizationInterceptor,
    },
    Reflector,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
