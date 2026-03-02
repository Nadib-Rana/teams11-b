/**
 * app.module.ts
 */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContextModule } from './common/context/context.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core'; // <-- Import Reflector
import { ResponseStandardizationInterceptor } from './common/interceptors/response-standardization.interceptor';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma.module';
import { PostModule } from './post/post.module';
import { ResponseModule } from './response/response.module';
import { CategoryModule } from './category/category.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PurchaseModule } from './purchase/purchase.module';
import { PushTokenModule } from './push-token/push-token.module';
import { FavoriteModule } from './favorite/favorite.module';
import { MinioModule } from './minio/minio.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';
import { MissionModule } from './mission/mission.module';
import { StreakModule } from './streak/streak.module';
import { InventoryModule } from './inventory/inventory.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ContextModule,
    UserModule,
    PrismaModule,
    PostModule,
    ResponseModule,
    CategoryModule,
    SubscriptionModule,
    PurchaseModule,
    PushTokenModule,
    FavoriteModule,
    MinioModule,
    NotificationModule,
    MissionModule,
    StreakModule,
    InventoryModule,
    FirebaseModule,
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
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
