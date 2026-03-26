import { Controller, Post, Body } from "@nestjs/common";
import { EmailService } from "./email.service";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { buyTokenTxEmail } from "../templates/buy.tokens.email";
import { SendEmailDto } from "./dto/send.email.dto";
import { paymentVerifiedEmail } from "../templates/payment.confirmation.email";

@ApiTags("Email")
@Controller("email")
export class EmailController {
  constructor(private readonly mailService: EmailService) {}

  @Post("send")
  @ApiOperation({
    summary: "Send an email",
    description: "Sends an email to the specified recipient.",
  })
  @ApiResponse({ status: 200, description: "Email sent successfully." })
  @ApiResponse({ status: 400, description: "Bad Request." })
  @ApiResponse({ status: 500, description: "Internal Server Error." })
  @ApiBody({ type: SendEmailDto })
  async sendEmail(@Body() body: SendEmailDto): Promise<{ message: string }> {
    const htmlContent = buyTokenTxEmail({
      paid_amount: body.paid_amount,
      paid_symbol: body.paid_symbol,
      tokens: body.tokens,
      wallet_address: body.wallet_address,
    });

    let subject = "Token Purchase Confirmation Email";
    let text = null;
    await this.mailService.sendEmail(body.to, subject, text, htmlContent);
    return { message: "Email sent successfully" };
  }

  @Post("send-payment-verified")
  @ApiOperation({
    summary: "Send Payment Verified Email",
    description:
      "Sends a payment verification confirmation email with static values.",
  })
  @ApiResponse({ status: 200, description: "Email sent successfully." })
  @ApiResponse({ status: 500, description: "Internal Server Error." })
  async sendPaymentVerifiedEmail(): Promise<{ message: string }> {
    // 🧩 Static values (you can change these as needed)
    const htmlContent = paymentVerifiedEmail({
      fullName: "Antonio Montes",
      transferMethod: "Bank Transfer",
      cryptoMethod: "USDT (TRC20)",
      amountPaid: "5950",
      proofFileUrl: "",
      txHash:
        "0x5277f62f6cb9b3649054c12ab6cc74e2c44b6394cc459aa785cbe6eeeedf4878",
      tokens: "1190000",
    });

    const subject = "Coin Purchased Confirmation";
    const recipient = "montes.antoine@lagoon.nc"; // 📩 static email for demo
    const text = null;

    await this.mailService.sendEmail(recipient, subject, text, htmlContent);

    return { message: "Payment verified email sent successfully" };
  }
}
