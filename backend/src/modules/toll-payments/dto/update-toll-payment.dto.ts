import { PartialType } from '@nestjs/swagger';
import { CreateTollPaymentDto } from './create-toll-payment.dto';
export class UpdateTollPaymentDto extends PartialType(CreateTollPaymentDto) {}
