import { IsString, IsNotEmpty, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SendEmailDto {
    @ApiProperty({
        description: "Recipient email address",
        example: "example@example.com",
    })
    @IsEmail()
    @IsNotEmpty()
    to: string;

    @ApiProperty({
        description: "Paid amount for the transaction",
        example: "100",
    })
    @IsString()
    @IsNotEmpty()
    paid_amount: string;

    @ApiProperty({
        description: "Currency symbol for the paid amount",
        example: "ETH",
    })
    @IsString()
    @IsNotEmpty()
    paid_symbol: string;

    @ApiProperty({
        description: "Number of tokens purchased",
        example: "50",
    })
    @IsString()
    @IsNotEmpty()
    tokens: string;

    @ApiProperty({
        description: "Wallet address of the user",
        example: "0x1234567890abcdef1234567890abcdef12345678",
    })
    @IsString()
    @IsNotEmpty()
    wallet_address: string;
}
