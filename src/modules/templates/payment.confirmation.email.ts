type IBuyEmail = {
  fullName: string;
  transferMethod: string;
  cryptoMethod: string;
  amountPaid: string;
  proofFileUrl: string;
  txHash: string;
  tokens: string;
};

export const paymentVerifiedEmail = ({
  fullName,
  transferMethod,
  cryptoMethod,
  amountPaid,
  proofFileUrl,
  txHash,
  tokens,
}: IBuyEmail) => `<html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email Template</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #c9fa49;
          border-radius: 20px;
          padding: 30px;
          background-image: url(https://fair-grade-forests.vercel.app/assets/images/email/background.png);
          background-size: 100% 100%;
          color: #141414;
        }
        .header h1 {
          text-align: center;
          font-size: 28px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .content p {
          font-size: 16px;
          line-height: 1.6;
        }
        .content ul {
          list-style-type: disc;
          padding-left: 20px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>FGF Coin Payment Verified!</h1>
        </div>
        <div class="content">
          <p>Hello ${fullName},</p>
          <p>We are pleased to inform you that your payment for FGF Coins has been successfully <strong>verified</strong>.</p>
          <p>Verified Payment Details:</p>
          <ul>
            <li><strong>Date of Verification:</strong> ${new Date().toLocaleDateString()}</li>
            <li><strong>Transfer Method:</strong> ${transferMethod || cryptoMethod}</li>
            <li><strong>Amount Paid:</strong> ${amountPaid} USD</li>
            <li><strong>FGF Tokens Purchased:</strong> ${tokens} FGF</li>
          <li>
                    <strong>Transaction:</strong>
                    <a href="https://basescan.org/tx/${txHash}" target="_blank">
                      (View on Blockchain Explorer)
                    </a>
                  </li>
          </ul>
          <p>Your tokens have been processed and will appear on your dashboard shortly (or once the token officially launches).</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Thank you for choosing <strong>FGF</strong> Coins!</p>
          <p>Best regards,<br/><strong>FGF Team</strong></p>
        </div>
      </div>
    </body>
  </html>`;
