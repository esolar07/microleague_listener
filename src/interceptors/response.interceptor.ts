// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// // import { Reflector } from '@nestjs/core';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';

// interface ResponseFormat<T> {
//   statusCode: number;
//   message: string;
//   data: T;
// }

// @Injectable()
// export class ResponseInterceptor<T>
//   implements NestInterceptor<T, ResponseFormat<T>>
// {
//   constructor(private reflector: Reflector) {}

//   intercept(
//     context: ExecutionContext,
//     next: CallHandler,
//   ): Observable<ResponseFormat<T>> {
//     const response = context.switchToHttp().getResponse();
//     const statusCode = response.statusCode;

//     // Retrieve the custom message from the metadata
//     const customMessage = this.reflector.get<string>(
//       'Message',
//       context.getHandler(),
//     );
//     const message = customMessage || 'Success';
//     return next.handle().pipe(
//       map((data) => ({
//         statusCode,
//         message,
//         data,
//       })),
//     );
//   }
// }

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Reflector } from "@nestjs/core";
import { MESSAGE_METADATA_KEY } from "src/decorators/message.decorator";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if the endpoint should skip response wrapping
    const skipInterceptor = this.reflector.get<boolean>(
      'skipResponseInterceptor',
      context.getHandler()
    );

    if (skipInterceptor) {
      return next.handle();
    }

    // Get the custom message from the metadata
    const customMessage = this.reflector.get<string>(
      MESSAGE_METADATA_KEY,
      context.getHandler()
    );

    return next.handle().pipe(
      map((data) => {
        // Don't wrap StreamableFile responses
        if (data instanceof StreamableFile) {
          return data;
        }

        const statusCode = context.switchToHttp().getResponse().statusCode;

        return {
          statusCode,
          message: customMessage || "Request successful", // Use custom message if available
          data,
        };
      })
    );
  }
}
