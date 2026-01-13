import { StockpileLocationsService } from './stockpile-locations.service';
import { CreateStockpileLocationDto } from './dto/create-stockpile-location.dto';
import { UpdateStockpileLocationDto } from './dto/update-stockpile-location.dto';
export declare class StockpileLocationsController {
    private readonly stockpileLocationsService;
    constructor(stockpileLocationsService: StockpileLocationsService);
    create(createDto: CreateStockpileLocationDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }>;
    findAll(page?: number, limit?: number, search?: string, isActive?: string): Promise<{
        items: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }>;
    update(id: string, updateDto: UpdateStockpileLocationDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }>;
}
