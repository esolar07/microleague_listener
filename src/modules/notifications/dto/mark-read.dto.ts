import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsOptional } from 'class-validator';

export class MarkReadDto {
  @ApiProperty({
    description: 'Array of notification IDs to mark as read',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  notificationIds: string[];
}

export class MarkAllReadDto {
  @ApiProperty({
    description: 'Mark all notifications as read for the current user',
    example: true,
  })
  @IsOptional()
  all?: boolean = true;
}
