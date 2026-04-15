import { HttpException, HttpStatus } from '@nestjs/common';

export class CreditsExhaustedException extends HttpException {
  constructor(
    message = 'Credit allowance exhausted. Upgrade your plan for additional credits or overage billing.'
  ) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Credits Exhausted',
        message,
      },
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}
