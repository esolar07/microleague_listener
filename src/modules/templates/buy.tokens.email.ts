type IBuyEmail = {
  wallet_address: string;
  tokens: string;
  paid_amount: string;
  paid_symbol: string;
};
export const buyTokenTxEmail = ({
  wallet_address,
  tokens,
  paid_amount,
  paid_symbol,
}: IBuyEmail) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .email-container {
        width: 100%;
        max-width: 600px;
        margin: 20px auto;
        background-color: #5d2554;
        color: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        padding-top: 0;
      }
      .section1 {
        padding: 45px 30px 0px 30px;
        background-image: url(https://www.nuttyhunt.com/assets/images/email/congbg.png);
        background-size: 100% 100%;
      }
      .section2 {
        padding: 0px 30px 45px 30px;
        background-image: url(https://www.nuttyhunt.com/assets/images/email/footer.png);

        background-image: url();
        background-size: 100% 100%;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        text-transform: uppercase;
      }
      .header img {
        display: block;
        margin: auto;
        margin-top: 8px;
      }
      .content {
        font-size: 14px;
        line-height: 1.6;
      }
      .content p {
        margin: 10px 0;
      }
      .content ul {
        list-style-type: disc; /* Ensures dots are displayed */
        padding-left: 20px; /* Adds space for the dots */
        margin-top: 20px;
      }
      .content ul li {
        margin: 8px 0;
      }
      .footer {
        text-align: center;
        margin-top: 40px;
        padding-bottom: 10px;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="section1">
        <div class="header">
          <h1>
            Congratulations
            <img
              src="https://www.nuttyhunt.com/assets/images/email/heading.png"
              alt=""
            />
          </h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>
            Congratulations! You have successfully purchased
            <strong>${tokens}</strong> FGFCoin.
          </p>
          <p>Details of Your Purchase:</p>
          <ul>
            <li><strong>Wallet Address:</strong> ${wallet_address}</li>
            <li><strong>Number of Tokens:</strong> ${tokens}</li>
            <li><strong>Amount Paid:</strong> ${paid_amount} ${paid_symbol}</li>
          </ul>
        </div>
      </div>
      <div class="content section2">
        <p>
          Your purchased tokens will appear in your dashboard once the token is
          officially launched.
        </p>
        <p>Thank you for choosing FGF.</p>
        <!-- <div class="footer">
          &copy; 2024 FGF Coin. All rights reserved.
        </div> -->
      </div>
    </div>
  </body>
</html>`;
