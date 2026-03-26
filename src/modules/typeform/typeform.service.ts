import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateTypeformDto } from "./dto/update-typeform.dto";
import { InjectModel } from "@nestjs/mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";
import { Model } from "mongoose";
import { TypeformDocument } from "./entities/typeform.entity";
import { EmailService } from "../email/email.service";
import { typeFormTxEmail } from "../templates/typeForm.email";
import { paymentVerifiedEmail } from "../templates/payment.confirmation.email";
import {
  PresaleTxsDocument,
  PresaleTxType,
} from "../transactions/entities/presale.entity";

@Injectable()
export class TypeformService {
  constructor(
    @InjectModel(DB_COLLECTIONS.TYPEFORM)
    private readonly typeformModel: Model<TypeformDocument>,
    @InjectModel(DB_COLLECTIONS.PRE_SALES_TXS)
    private presaleModel: Model<PresaleTxsDocument>,
    private readonly emailService: EmailService
  ) {}
  // Process webhook and save to MongoDB
  async processPayment(data: any): Promise<any> {
    const { form_response } = data;
    const answers = form_response?.answers || [];
    const fields = form_response?.definition?.fields || [];

    const paymentMethodType = form_response?.definition?.title || "Unknown";

    // --- Universal helper to extract the answer by field title ---
    const getAnswer = (title: string) => {
      const field = fields.find((f: any) =>
        f.title.toLowerCase().includes(title.toLowerCase())
      );
      if (!field) return null;

      return answers.find((a: any) => a.field.id === field.id) || null;
    };

    // --- Full name ---
    const fullName =
      getAnswer("What is your full name?")?.text ||
      getAnswer("Your full name")?.text ||
      null;

    // --- Email ---
    const email =
      getAnswer("email")?.email || getAnswer("email address")?.email || null;

    // --- Amount paid (String or Number) ---
    const amountField = getAnswer("Amount Paid");
    let amountPaid = null;

    if (amountField?.text) amountPaid = amountField.text;
    if (amountField?.number) amountPaid = amountField.number.toString();

    // --- Proof file ---
    const proofField = getAnswer("proof") || getAnswer("upload") || null;

    let proofFileUrl = null;
    if (proofField?.file_url) proofFileUrl = proofField.file_url;
    if (proofField?.file_urls?.length) proofFileUrl = proofField.file_urls[0];

    // --- Transaction hash (for crypto payments) ---
    const txHash = getAnswer("transaction hash")?.text || null;

    // --- Crypto-specific fields ---
    let cryptoMethod = null;
    let walletAddress = null;

    if (paymentMethodType.toLowerCase().includes("crypto")) {
      const methodField = getAnswer("preferred Crypto payment method");
      cryptoMethod = methodField?.choice?.label || null;

      if (cryptoMethod) {
        const walletField = fields.find(
          (f: any) => f.title.toLowerCase() === cryptoMethod.toLowerCase()
        );
        const walletAnswer = answers.find(
          (a: any) => a.field.id === walletField?.id
        );
        walletAddress =
          walletAnswer?.text || walletAnswer?.choice?.label || null;
      }
    }

    // --- Validate required fields ---
    if (!fullName || !email || !amountPaid) {
      throw new Error("Missing required fields from Typeform submission");
    }

    // --- Token calculation ---
    const fgfTokenValue = 0.005;
    const amountInUSD = parseFloat(amountPaid);
    const tokenAmount = parseFloat((amountInUSD / fgfTokenValue).toFixed(2));

    // --- Save to MongoDB ---
    const payment = new this.typeformModel({
      fullName,
      email,
      amountPaid,
      proofFileUrl,
      tokens: tokenAmount,
      transferMethod: paymentMethodType,
      cryptoMethod,
      walletAddress,
      txHash,
      formId: form_response?.form_id,
      submittedAt: Math.floor(
        new Date(form_response.submitted_at).getTime() / 1000
      ),
    });

    await payment.save();

    // --- Send confirmation email ---
    const emailHtml = typeFormTxEmail({
      fullName: payment.fullName,
      transferMethod: payment.transferMethod,
      cryptoMethod: payment.cryptoMethod || "N/A",
      amountPaid: payment.amountPaid,
      proofFileUrl: payment.proofFileUrl || "N/A",
      txHash: payment.txHash || "N/A",
      tokens: payment.tokens.toString(),
    });

    this.emailService.sendEmail(
      email,
      "Payment Confirmation Received",
      null,
      emailHtml
    );

    return payment;
  }

  async findAll() {
    return this.typeformModel.find().exec();
  }

  async findOne(id: string) {
    const typeform = await this.typeformModel.findById(id).exec();
    if (!typeform) {
      throw new NotFoundException(`Typeform with id ${id} not found`);
    }
    return typeform;
  }

  async update(id: string, updateTypeformDto: UpdateTypeformDto) {
    const updatedTypeform = await this.typeformModel.findByIdAndUpdate(
      id,
      { $set: updateTypeformDto },
      { new: true }
    );

    if (!updatedTypeform) {
      throw new NotFoundException(`Typeform with id ${id} not found`);
    }

    await this.presaleModel.create({
      amount: updatedTypeform.amountPaid,
      tokens: updatedTypeform.tokens.toString(),
      timestamp: updatedTypeform.submittedAt,
      email: updatedTypeform.email,
      txHash: updatedTypeform.txHash,
      type: updatedTypeform.transferMethod,
      typeformId: updatedTypeform._id,
    });

    // --- ✉️ Send confirmation email ---
    const emailHtml = paymentVerifiedEmail({
      fullName: updatedTypeform.fullName,
      transferMethod: updatedTypeform.transferMethod,
      cryptoMethod: updatedTypeform.cryptoMethod,
      amountPaid: updatedTypeform.amountPaid,
      proofFileUrl: updatedTypeform.proofFileUrl,
      txHash: updateTypeformDto.txHash,
      tokens: updatedTypeform.tokens.toString(),
    });

    const subject = "Coin Purchased Confirmation";
    const to = updatedTypeform.email;

    if (to) {
      this.emailService.sendEmail(to, subject, null, emailHtml);
    }

    return updatedTypeform;
  }

  async edit(id: string, updateTypeformDto: UpdateTypeformDto) {
    const updatedTypeform = await this.typeformModel.findByIdAndUpdate(
      id,
      { $set: updateTypeformDto },
      { new: true }
    );
    return updatedTypeform;
  }

  remove(id: number) {
    return `This action removes a #${id} typeform`;
  }
}
