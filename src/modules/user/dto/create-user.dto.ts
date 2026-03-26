import { IsString, IsOptional } from "class-validator";

export class CreateUserDTO {
    @IsString()
    @IsOptional()
    walletAddress: string;

    @IsString()
    email: string;
}
export class AddReferralDTO {
    @IsString()
    referralId: string;
}
