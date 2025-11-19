import { HttpException, HttpStatus } from '@nestjs/common';

export class UsageLimitExceededException extends HttpException {
  constructor(message = 'Daily usage limit exceeded. Upgrade to Premium for unlimited access') {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Usage Limit Exceeded',
        message,
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}
