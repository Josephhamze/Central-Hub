import { DeliveryMethod, PaymentTerms, TruckType } from '@prisma/client';
import { CreateQuoteItemDto } from './create-quote-item.dto';
export declare class CreateQuoteDto {
    companyId: string;
    projectId: string;
    customerId: string;
    contactId?: string;
    warehouseId?: string;
    deliveryMethod: DeliveryMethod;
    routeId?: string;
    deliveryAddressLine1?: string;
    deliveryAddressLine2?: string;
    deliveryCity?: string;
    deliveryState?: string;
    deliveryPostalCode?: string;
    deliveryCountry?: string;
    validityDays?: number;
    paymentTerms?: PaymentTerms;
    deliveryStartDate?: string;
    loadsPerDay?: number;
    truckType?: TruckType;
    items: CreateQuoteItemDto[];
}
