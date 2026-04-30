import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import * as fs from "fs";
import * as path from "path";
import {
  RECEIVE_BID_INTERFACE,
  SEND_BID_INTERFACE,
  BUY_TOKEN_INTERFACE,
  LISTED_FOR_SALE_INTERFACE,
  TOKEN_OWNER_INTERFACE,
  PRIVATE_SALE_CONFIRMATION_INTERFACE,
} from "./email.interface";
import { APP_NAME, EMAIL_TEMPLATE_DIR } from "src/constants/general.constants";

const LOGO_PATH = path.join(process.cwd(), "static", "logo.png");

@Injectable()
export class EmailQueueService {
  constructor(private readonly mailerService: MailerService) {}

  async receiveBid(data: RECEIVE_BID_INTERFACE): Promise<void> {
    this.mailerService
      .sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Crypto Origins"}" <${process.env.MAIL_FROM_EMAIL || "no-reply@cryptoorigins.com"}>`,
        to: data.email,
        subject: `${APP_NAME} | New Bid Received for ${data.tokenName}`,
        text: `Hi, your token "${data.tokenName}" has received a bid of ${data.price} from ${data.bidderName || "a user"}.`,
        template: EMAIL_TEMPLATE_DIR + "/ReceiveBid", // You should create this template
        context: {
          tokenName: data.tokenName,
          price: data.price,
          image: data.image,
          bidderName: data.bidderName,
        },
      })
      .then((success) => {
        console.log("Receive bid email sent successfully:", success);
      })
      .catch((err) => {
        console.log("Receive bid email error:", err);
      });
  }

  async sendBid(data: SEND_BID_INTERFACE): Promise<void> {
    this.mailerService
      .sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Crypto Origins"}" <${process.env.MAIL_FROM_EMAIL || "no-reply@cryptoorigins.com"}>`,
        to: data.email,
        subject: `${APP_NAME} | Bid Placed for ${data.tokenName}`,
        text: `Hi, you have placed a bid of ${data.price} on token "${data.tokenName}" owned by ${data.ownerName || "a user"}.`,
        template: EMAIL_TEMPLATE_DIR + "/SendBid", // You should create this template
        context: {
          tokenName: data.tokenName,
          price: data.price,
          image: data.image,
          ownerName: data.ownerName,
          bidderName: data.bidderName,

        },
      })
      .then((success) => {
        console.log("Send bid email sent successfully:", success);
      })
      .catch((err) => {
        console.log("Send bid email error:", err);
      });
  }

  async listedForSale(data: LISTED_FOR_SALE_INTERFACE): Promise<void> {
    this.mailerService
      .sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Crypto Origins"}" <${
          process.env.MAIL_FROM_EMAIL || "no-reply@cryptoorigins.com"
        }>`,
        to: data.email,
        subject: `${APP_NAME} ${data.tokenName} Listed for Sale!`,
        text: `Hi your nft has been successfully listed for sale`,
        template: EMAIL_TEMPLATE_DIR + "/CreateListing",
        context: {
          tokenName: `${data.tokenName}`,
          amount: `${data.amount}`,
          Image: `${data.image}`,
        },
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log("mail error", err);
      });
  }

  async listingCancelled(data: {
    email: string;
    tokenName: string;
    image?: string;
  }): Promise<void> {
    this.mailerService
      .sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Crypto Origins"}" <${
          process.env.MAIL_FROM_EMAIL || "no-reply@cryptoorigins.com"
        }>`,
        to: data.email,
        subject: `${APP_NAME} | Listing Cancelled - ${data.tokenName}`,
        text: `Hi, your NFT "${data.tokenName}" listing has been cancelled.`,
        template: EMAIL_TEMPLATE_DIR + "/CancelListing", // <-- new template
        context: {
          tokenName: data.tokenName,
          Image: data.image,
        },
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log("mail error", err);
      });
  }

  async buyTokenSuccess(data: BUY_TOKEN_INTERFACE): Promise<void> {
    this.mailerService
      .sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Crypto"}" <${
          process.env.MAIL_FROM_EMAIL || "no-reply@cryptoorigins.com"
        }>`,
        to: data.email,
        subject: `${APP_NAME} Token Purchase Successful!`,
        text: `Your token purchase has been successfully completed`,
        template: EMAIL_TEMPLATE_DIR + "/BuyToken",
        context: {
          nftName: `${data.tokenName}`,
          nftPrice: `${data.tokenPrice}`,
          nftImage: `${data.image}`,
          currency: "USDC",
        },
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log("mail error", err);
      });
  }

  async tokenOwnerSuccess(data: TOKEN_OWNER_INTERFACE): Promise<void> {
    this.mailerService
      .sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Crypto Origins"}" <${
          process.env.MAIL_FROM_EMAIL || "no-reply@cryptoorigins.com"
        }>`,
        to: data.email,
        subject: `${APP_NAME} Token purchased Successful!`,
        text: `Hi, your token  has been purchased successfully`,
        template: EMAIL_TEMPLATE_DIR + "/TokenOwner",
        context: {
          tokenName: `${data.tokenName}`,
          tokenPrice: `${data.tokenPrice}`,
          image: `${data.image}`,
          buyerName: `${data.buyerName}`,
        },
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log("mail error", err);
      });
  }

  async privateSaleConfirmation(data: PRIVATE_SALE_CONFIRMATION_INTERFACE): Promise<void> {
    const logoContent = fs.existsSync(LOGO_PATH) ? fs.readFileSync(LOGO_PATH) : null;

    this.mailerService
      .sendMail({
        from: `"MicroLeague" <${process.env.MAIL_FROM_EMAIL || 'no-reply@mail.temoc.io'}>`,
        to: data.email,
        subject: `MicroLeague | Private Sale Submission Received – ${data.submissionId}`,
        text: `Hi ${data.fullName}, your private sale submission (${data.submissionId}) for $${data.amount} has been received and is pending review.`,
        template: EMAIL_TEMPLATE_DIR + '/PrivateSaleConfirmation',
        attachments: logoContent
          ? [{ filename: 'logo.png', content: logoContent, cid: 'logo', contentType: 'image/png' }]
          : [],
        context: {
          fullName: data.fullName,
          submissionId: data.submissionId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          email: data.email,
          year: new Date().getFullYear(),
        },
      })
      .then(() => console.log(`Private sale confirmation email sent to ${data.email}`))
      .catch((err) => console.error('Private sale confirmation email error:', err));
  }

  async sendNftMintedEmail(data: {
    email: string;
    url: string;
    tokenName: string;
    nftImage: string;
  }): Promise<void> {
    this.mailerService
      .sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Crypto Origins"}" <${
          process.env.MAIL_FROM_EMAIL || "no-reply@cryptoorigins.com"
        }>`,
        to: data.email,
        subject: `${APP_NAME} | Congratulations! Your NFT "${data.tokenName}" has been minted!`,
        text: `Congratulations! Your NFT "${data.tokenName}" has been minted successfully! You can now view your NFT here: ${data.url}`,
        template: EMAIL_TEMPLATE_DIR + "/NftMintedSuccess", // <-- new template file
        context: {
          nftName: data.tokenName,
          url: data.url,
          nftImage: data.nftImage,
        },
      })
      .then((success) => {
        console.log("NFT minted email sent successfully:", success);
      })
      .catch((err) => {
        console.log("NFT minted email error:", err);
      });
  }
}
