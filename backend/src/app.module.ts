import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma.module';
import { IdempotencyInterceptor } from './common/idempotency/idempotency.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConsentsModule } from './modules/consents/consents.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { NeedsModule } from './modules/needs/needs.module';
import { InterestsModule } from './modules/interests/interests.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { AdminModule } from './modules/admin/admin.module';
import { CaregiversModule } from './modules/caregivers/caregivers.module';
import { PatientsModule } from './modules/patients/patients.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-ganti-di-prod',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any },
    }),
    AuthModule,
    UsersModule,
    ConsentsModule,
    DocumentsModule,
    DepositsModule,
    NeedsModule,
    InterestsModule,
    MessagesModule,
    ContractsModule,
    NotificationsModule,
    PaymentsModule,
    AttendanceModule,
    PayoutsModule,
    ReviewsModule,
    DisputesModule,
    AdminModule,
    CaregiversModule,
    PatientsModule,
    BookingsModule,
    FilesModule,
  ],
  providers: [
    // Idempotency-Key wajib untuk semua mutasi (lihat common/idempotency).
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class AppModule {}
