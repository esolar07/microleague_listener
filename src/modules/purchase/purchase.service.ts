import { Injectable } from "@nestjs/common";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";
import { InjectModel } from "@nestjs/mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";
import { Model } from "mongoose";
import { PurchaseDocument } from "./entities/purchase.entity";

@Injectable()
export class PurchaseService {
  @InjectModel(DB_COLLECTIONS.PURCHASE)
  readonly purchaseModel: Model<PurchaseDocument>;
}
