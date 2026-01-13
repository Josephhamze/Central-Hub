import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
export declare class ContactsController {
    private readonly contactsService;
    constructor(contactsService: ContactsService);
    findAll(customerId?: string, page?: number, limit?: number): Promise<{
        items: ({
            customer: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                type: import(".prisma/client").$Enums.CustomerType;
                companyName: string | null;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            isPrimary: boolean;
            customerId: string;
            roleTitle: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            type: import(".prisma/client").$Enums.CustomerType;
            companyName: string | null;
            billingAddressLine1: string;
            billingAddressLine2: string | null;
            billingCity: string;
            billingState: string | null;
            billingPostalCode: string;
            billingCountry: string | null;
            deliveryAddressLine1: string | null;
            deliveryAddressLine2: string | null;
            deliveryCity: string | null;
            deliveryState: string | null;
            deliveryPostalCode: string | null;
            deliveryCountry: string | null;
            phone: string | null;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        isPrimary: boolean;
        customerId: string;
        roleTitle: string | null;
    }>;
    create(dto: CreateContactDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        isPrimary: boolean;
        customerId: string;
        roleTitle: string | null;
    }>;
    update(id: string, dto: UpdateContactDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        isPrimary: boolean;
        customerId: string;
        roleTitle: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        isPrimary: boolean;
        customerId: string;
        roleTitle: string | null;
    }>;
}
