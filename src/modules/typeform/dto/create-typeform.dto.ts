import { IsString, IsOptional, IsEmail, IsNumberString } from "class-validator";

export class CreateTypeformDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsNumberString()
  amountPaid: string;

  @IsOptional()
  @IsString()
  proofFileUrl?: string;

  @IsString()
  transferMethod: string;

  @IsOptional()
  @IsString()
  cryptoMethod?: string;

  @IsOptional()
  @IsString()
  txHash?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
