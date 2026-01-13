import { Shift, QualityGrade } from '@prisma/client';
export declare class CreateCrusherOutputEntryDto {
    date: string;
    shift: Shift;
    crusherId: string;
    productTypeId: string;
    stockpileLocationId: string;
    outputTonnage: number;
    qualityGrade: QualityGrade;
    moisturePercentage?: number;
    notes?: string;
}
