import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeformDto } from './create-typeform.dto';

export class UpdateTypeformDto extends PartialType(CreateTypeformDto) {}
