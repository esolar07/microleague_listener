import { Body, Controller, Post } from "@nestjs/common";
import { PurchaseService } from "./purchase.service";
import { WertWebhokData } from "src/interfaces/wert.webook.interface";
import axios from "axios";
import { InjectModel } from "@nestjs/mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";
import { Model } from "mongoose";
import { UserDocument } from "../user/entities/user.entity";
import {
  PresaleTxsDocument,
  PresaleTxType,
} from "../transactions/entities/presale.entity";
import { N } from "ethers";
import { hash } from "crypto";

@Controller("purchase")
export class PurchaseController {
  constructor(
    @InjectModel(DB_COLLECTIONS.USERS)
    readonly userModel: Model<UserDocument>,
    private readonly purchaseService: PurchaseService,
    @InjectModel(DB_COLLECTIONS.PRE_SALES_TXS)
    private transactionModel: Model<PresaleTxsDocument>
  ) {}

  @Post("webhook/wert")
  async wertWebhook(@Body() data: WertWebhokData) {
    if (data.type !== "order_complete") {
      return false;
    }

    const order = data?.order;

    // const response = await axios.get(
    //   "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
    //   {
    //     headers: {
    //       "X-CMC_PRO_API_KEY": "5ad521ef-59e6-4250-8570-6d793db4b4a5",
    //     },
    //     params: {
    //       symbol: "RFC",
    //     },
    //   }
    // );
    // const rate = response?.data?.data["RFC"]?.quote?.USD?.price;
    // const fgfAmount = Number(Number(order?.quote_amount) / rate).toFixed(2);
    const email = data?.click_id?.split("+")?.[0];

    const purchase = new this.purchaseService.purchaseModel({
      amount: Number(order?.quote_amount),
      quote: order?.quote,
      ethAmount: Number(order?.base_amount),
      primaryWalletAddress: order.address,
      timestamp: Date.now() / 1000,
      transactionHash: order?.transaction_id,
      chainId: 8453,
      email: email,
    });

    await this.transactionModel.findOneAndUpdate(
      {
        txHash: order?.transaction_id,
      },
      {
        type: "Card Payment",
        usdAmount: Number(order?.quote_amount),
        quote: order?.quote,
      }
    );

    await purchase.save();
    return purchase;
  }
}
