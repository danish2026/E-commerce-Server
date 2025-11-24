import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order_item.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
