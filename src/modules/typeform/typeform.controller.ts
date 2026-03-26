import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { TypeformService } from "./typeform.service";
import { UpdateTypeformDto } from "./dto/update-typeform.dto";

@Controller("typeform")
export class TypeformController {
  constructor(private readonly typeformService: TypeformService) {}

  @Post("webhook")
  async handlePaymentWebhook(@Body() body: any) {
    try {
      const payment = await this.typeformService.processPayment(body);
      return { message: "Payment processed successfully", data: payment };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || "Failed to process payment",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  findAll() {
    return this.typeformService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.typeformService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateTypeformDto: UpdateTypeformDto
  ) {
    return this.typeformService.update(id, updateTypeformDto);
  }

  @Patch("edit/:id")
  edit(@Param("id") id: string, @Body() updateTypeformDto: UpdateTypeformDto) {
    return this.typeformService.edit(id, updateTypeformDto);
  }
}
