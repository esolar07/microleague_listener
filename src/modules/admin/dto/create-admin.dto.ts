import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEthereumAddress } from "class-validator";

export class CreateAdminDto {
  @ApiProperty({
    description: "First name of the admin",
    example: "Super",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "Last name of the admin",
    example: "Admin",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "Ethereum wallet address of the admin",
    example: "0x9ed422636822d4db66c26acd856bf0ce25ae6fa5",
  })
  @IsString()
  @IsNotEmpty()
  @IsEthereumAddress()
  address: string;

  @ApiProperty({
    description: "Whether the admin has super admin privileges",
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  superAdmin?: boolean;
}