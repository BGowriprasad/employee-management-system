import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const duplicate = this.isDuplicateEntry(exception);
    const status = duplicate
      ? HttpStatus.CONFLICT
      : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: duplicate ? 'Conflict' : 'Internal Server Error',
      message: duplicate
        ? this.getDuplicateMessage(exception.message)
        : 'A database error occurred. Please check your input values.',
    });
  }

  private isDuplicateEntry(exception: QueryFailedError): boolean {
    const code = (exception as { code?: string }).code;
    return (
      code === 'ER_DUP_ENTRY' ||
      code === '23505' ||
      /duplicate/i.test(exception.message)
    );
  }

  private getDuplicateMessage(message: string): string {
    const match = message.match(/Duplicate entry '([^']+)' for key '([^']+)'/i);

    if (match) {
      return `Duplicate value '${match[1]}' for field '${match[2]}'.`;
    }

    return 'Duplicate entry detected.';
  }
}
