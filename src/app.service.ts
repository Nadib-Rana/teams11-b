import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from './common/exceptions/http.exceptions';

@Injectable()
export class AppService {
  getHello(): string {
    throw new UnauthorizedException(
      'Your session has expired.',
      'SESSION_EXPIRED',
      undefined,
      'LOGOUT_USER',
      { needOtpVerification: true },
    );
  }
}
