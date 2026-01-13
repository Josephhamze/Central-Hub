import { CustomerType } from '@prisma/client';
export declare class CreateCustomerDto {
    type: CustomerType;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    billingAddressLine1: string;
    billingAddressLine2?: string;
    billingCity: string;
    billingState?: string;
    billingPostalCode: string;
    billingCountry?: string;
    deliveryAddressLine1?: string;
    deliveryAddressLine2?: string;
    deliveryCity?: string;
    deliveryState?: string;
    deliveryPostalCode?: string;
    deliveryCountry?: string;
    phone?: string;
    email?: string;
}
