import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentRequiredException extends HttpException {
  constructor(message = 'This feature requires a Premium subscription') {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Payment Required',
        message,
      },
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}
