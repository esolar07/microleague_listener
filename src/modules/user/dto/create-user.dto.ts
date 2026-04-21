import { IsString, IsOptional } from "class-validator";

export class CreateUserDTO {
    @IsString()
    @IsOptional()
    walletAddress?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    fullName?: string;
}

export class AddReferralDTO {
    @IsString()
    referralId: string;
}
