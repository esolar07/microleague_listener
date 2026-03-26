import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";
import { ClaimRequest } from "./entities/claims.entity";
import { paginate } from "src/utils/pagination.util";
import { CreateClaimDto, UpdateClaimDto } from "./dto/claims.dto";
import { ethers, formatUnits, ZeroAddress } from "ethers";
import { PRESALE_ABI } from "../listener/abis/presaleAbi";

@Injectable()
export class ClaimsService {
  private provider: ethers.JsonRpcProvider;
  private tokenAddress: string;
  private abi = PRESALE_ABI;
  constructor(
    @InjectModel(DB_COLLECTIONS.CLAIM_REQUEST)
    public claimModel: Model<ClaimRequest>
  ) {
    this.provider = new ethers.JsonRpcProvider(
      "https://mainnet.infura.io/v3/347a63bfe66b4747a911978ee0cf5469"
    );
    this.tokenAddress = "0xc228D5171c5a145Eb3616491Ccdaf226d5481FFc";
  }

  async createClaim(data: CreateClaimDto) {
    return this.claimModel.create(data);
  }

  async findAll(email: string, limit = 10, page = 1) {
    let query: any = {};
    if (email) {
      query.email = email;
    }
    return paginate(this.claimModel, query, { limit, page });
  }

  async updateClaim(id: string, data: UpdateClaimDto) {
    return this.claimModel.findByIdAndUpdate(id, data);
  }

  async findClaimByUserId(userId: string, limit = 10, page = 1) {
    const query = { userId }; // Filter by userId
    return paginate(this.claimModel, query, { limit, page });
  }

  async processClaimTxs(
    eventName: string,
    contractDetails: any,
    event: any,
    provider: any
  ): Promise<void> {
    try {
      const transaction = await provider.getTransaction(event.transactionHash);
      const block = await provider.getBlock(transaction.blockNumber);
      const eventTimestamp = Number(block.timestamp);

      const { user, amount } = event.args;

      const eventData = {
        contractAddress: contractDetails.address,
        eventName,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: eventTimestamp,
      };

      const formattedAmount = formatUnits(amount, 18);

      // Check for existing record
      const existingRecord = await this.claimModel.findOne({
        txHash: event.transactionHash,
      });

      if (existingRecord) {
        console.log(
          `Duplicate transaction detected: ${event.transactionHash}, skipping...`
        );
        return; // Exit if the record already exists
      }

      // Save to the database
      await this.claimModel.create({
        address: user,
        amount: formattedAmount,
        chainId: 1,
        contract: contractDetails.address,
        timestamp: eventTimestamp,
        txHash: event.transactionHash,
      });

      console.log(
        `Saved event to database: ${eventName}-${contractDetails.name} on ${contractDetails.address}`,
        eventData
      );
    } catch (error) {
      console.log(
        `Error saving event to database: ${error.message}`,
        error.stack
      );
    }
  }

  claimBacksync = (contractDetails, provider) => {
    const contract = new ethers.Contract(
      contractDetails.address,
      contractDetails.abi,
      provider
    );

    for (const eventName of contractDetails.events) {
      // Listen for real-time events
      contract.on(eventName, async (...args) => {
        const event = args[args.length - 1]; // The event object is the last
        const log = event.log; // Extract the log property for details
        console.log(`${eventName} event received`);
        await this.processClaimTxs(eventName, contractDetails, log, provider);
      });

      // Optionally, fetch and handle past events
      let fromBlock = contractDetails.startBlock;
      if (contractDetails.listenToPreviousEvents) {
        fromBlock = 0; // Start from the first block
      }

      let toBlock = "latest";
      if (contractDetails.stopListeningToPreviousEvents) {
        toBlock = contractDetails.startBlock; // Stop listening at the start block
      }

      contract.queryFilter(eventName, fromBlock, toBlock).then((events) => {
        events.forEach(async (event) => {
          console.log(`${eventName} past event found`);
          await this.processClaimTxs(
            eventName,
            contractDetails,
            event,
            provider
          );
        });
      });
    }
  };

  async getTokenDetails(walletAddresses: string[]): Promise<any[]> {
    try {
      const contract = new ethers.Contract(this.tokenAddress, this.abi);
      const balancePromises = walletAddresses.map(async (wallet) => {
        try {
          const balance = await contract.balanceOf(wallet);
          const formattedBalance = ethers.formatUnits(balance, 6); // Adjust decimal places if needed

          // Fetch first purchase date
          const events = await contract.queryFilter("Transfer", 0, "latest");
          let firstPurchaseDate = "No transactions found.";

          for (const event of events) {
            const eventWithArgs = event as ethers.EventLog;
            if (eventWithArgs.args.to.toLowerCase() === wallet.toLowerCase()) {
              const block = await this.provider.getBlock(event.blockNumber);
              firstPurchaseDate = new Date(
                block.timestamp * 1000
              ).toISOString();
              break;
            }
          }

          return { wallet, balance: formattedBalance, firstPurchaseDate };
        } catch (error) {
          return {
            wallet,
            balance: "Error fetching balance",
            firstPurchaseDate: "Error fetching date",
          };
        }
      });

      return await Promise.all(balancePromises);
    } catch (error) {
      throw new HttpException(
        "Error fetching token details",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
