import { PitLocationsService } from './pit-locations.service';
import { CreatePitLocationDto } from './dto/create-pit-location.dto';
import { UpdatePitLocationDto } from './dto/update-pit-location.dto';
export declare class PitLocationsController {
    private readonly pitLocationsService;
    constructor(pitLocationsService: PitLocationsService);
    create(createDto: CreatePitLocationDto): Promise<{
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
    update(id: string, updateDto: UpdatePitLocationDto): Promise<{
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
