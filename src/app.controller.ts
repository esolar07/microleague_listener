import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { AppService } from "./app.service";
import { Message } from "./decorators/message.decorator";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Message("Success")
  getHello() {
    return this.appService.getHello();
  }
}
