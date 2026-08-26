import { PartialType } from '@nestjs/mapped-types';
import { CreateIceTankDto } from './create-ice-tank.dto';

export class UpdateIceTankDto extends PartialType(CreateIceTankDto) {}
