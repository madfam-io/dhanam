import { HttpException, HttpStatus } from '@nestjs/common';

export class SubscriptionExpiredException extends HttpException {
  constructor(
    message = 'Your subscription has expired. Please renew to continue using premium features'
  ) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Subscription Expired',
        message,
      },
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}
