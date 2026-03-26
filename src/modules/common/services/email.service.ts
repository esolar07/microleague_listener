import { Injectable } from "@nestjs/common";
// import * as FormData from "form-data";
// import Mailgun from "mailgun.js";
import { config } from "dotenv";
import { MailerService } from "@nestjs-modules/mailer";

config();
// const mailgun = new Mailgun(FormData);
// const mg = mailgun.client({
//     username: "api",
//     key: process.env.MAILGUN_API_KEY || "key-yourkeyhere",
// });

@Injectable()
export class EmailService {
    constructor(private readonly mailerService: MailerService) {}

    async sendEmail(to: string, subject: string, text: string, htmlContent) {
        await this.mailerService.sendMail({
            to,
            subject,
            text,
            html: htmlContent,
        });
    }

    // async sendStartVestingEmailToUser(to, address) {
    //     const htmlContent = buyTokenTxEmail({ address });
    //     mg.messages
    //         .create(process.env.MAILGUN_DOMAIN, {
    //             from: `"rfcofficial.io" <admin@rfcofficial.io>`,
    //             to: [to],
    //             subject: "RFC Official - Token Vesting Request",
    //             text: "Token Vesting Request",
    //             html: htmlContent,
    //         })
    //         .then((msg) => console.log(msg)) // logs response data
    //         .catch((err) => console.log(err)); // logs any error;;
    // }
}
