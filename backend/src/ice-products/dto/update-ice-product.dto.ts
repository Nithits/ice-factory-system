import { PartialType } from '@nestjs/mapped-types';
import { CreateIceProductDto } from './create-ice-product.dto';

export class UpdateIceProductDto extends PartialType(CreateIceProductDto) {}