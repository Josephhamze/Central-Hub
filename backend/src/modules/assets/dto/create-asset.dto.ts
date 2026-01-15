import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus, AssetCriticality, IndexType, AssetLifecycleStatus } from '@prisma/client';

export class CreateAssetDto {
  // ASSET IDENTITY
  @ApiProperty({ description: 'Asset name' })
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @ApiProperty({ description: 'Asset category (e.g., Crusher, Truck, Generator)' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Specific type of asset' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'System generated asset family' })
  @IsString()
  @IsOptional()
  family?: string;

  @ApiProperty({ description: 'Manufacturer name' })
  @IsString()
  @IsNotEmpty()
  manufacturer: string;

  @ApiProperty({ description: 'Model number' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiPropertyOptional({ description: 'Manufacturing year' })
  @IsInt()
  @IsOptional()
  yearModel?: number;

  @ApiPropertyOptional({ description: 'Primary color' })
  @IsString()
  @IsOptional()
  color?: string;

  // ALLOCATION
  @ApiProperty({ description: 'Company ID that owns this asset' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Project ID the asset is allocated on' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'Internal company code for the owning company' })
  @IsString()
  @IsNotEmpty()
  companyCode: string;

  @ApiPropertyOptional({ description: 'Country where the asset is legally registered' })
  @IsString()
  @IsOptional()
  countryOfRegistration?: string;

  @ApiPropertyOptional({ description: 'Site or location where the asset is currently based' })
  @IsString()
  @IsOptional()
  currentLocation?: string;

  @ApiPropertyOptional({ description: 'Parent asset ID if this asset is attached to another' })
  @IsString()
  @IsOptional()
  parentAssetId?: string;

  // IDENTIFICATION
  @ApiPropertyOptional({ description: 'Manufacturer serial number (required if no registration_number)' })
  @IsString()
  @ValidateIf((o) => !o.registrationNumber)
  @IsNotEmpty()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Chassis or frame identification number' })
  @IsString()
  @IsOptional()
  chassisNumber?: string;

  @ApiPropertyOptional({ description: 'Engine serial number' })
  @IsString()
  @IsOptional()
  engineNumber?: string;

  @ApiPropertyOptional({ description: 'Legal registration or plate number (required if no serial_number)' })
  @IsString()
  @ValidateIf((o) => !o.serialNumber)
  @IsNotEmpty()
  registrationNumber?: string;

  // FINANCIAL INFORMATION
  @ApiProperty({ description: 'Purchase date (ISO 8601)' })
  @IsDateString()
  purchaseDate: string;

  @ApiProperty({ description: 'Purchase cost' })
  @IsNumber()
  @Min(0)
  purchaseValue: number;

  @ApiProperty({ description: 'Currency of the purchase value', default: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiPropertyOptional({ description: 'Cost to replace this asset with a new one' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  brandNewValue?: number;

  @ApiPropertyOptional({ description: 'Current estimated resale value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentMarketValue?: number;

  @ApiPropertyOptional({ description: 'Expected value at the end of its life' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  residualValue?: number;

  @ApiPropertyOptional({ description: 'Purchase order reference number' })
  @IsString()
  @IsOptional()
  purchaseOrder?: string;

  @ApiPropertyOptional({ description: 'Accounting general ledger account' })
  @IsString()
  @IsOptional()
  glAccount?: string;

  // LIFECYCLE
  @ApiProperty({ description: 'Date the asset entered service (ISO 8601)' })
  @IsDateString()
  installDate: string;

  @ApiProperty({ description: 'Planned replacement or retirement date (ISO 8601)' })
  @IsDateString()
  endOfLifeDate: string;

  @ApiPropertyOptional({ description: 'Date the asset was sold or disposed of (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  disposalDate?: string;

  @ApiPropertyOptional({ enum: AssetLifecycleStatus, description: 'Current lifecycle phase' })
  @IsEnum(AssetLifecycleStatus)
  @IsOptional()
  assetLifecycleStatus?: AssetLifecycleStatus;

  // INDEX DETAILS
  @ApiProperty({ enum: IndexType, description: 'How usage of the asset is measured' })
  @IsEnum(IndexType)
  indexType: IndexType;

  @ApiPropertyOptional({ description: 'Current usage reading' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentIndex?: number;

  @ApiPropertyOptional({ description: 'Usage reading when the asset was purchased' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  indexAtPurchase?: number;

  @ApiPropertyOptional({ description: 'Date the usage reading was last recorded (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  lastIndexDate?: string;

  // STATUS
  @ApiProperty({ enum: AssetStatus, default: AssetStatus.OPERATIONAL })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Date this status began (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  statusSince?: string;

  @ApiPropertyOptional({ description: 'Percentage of time the asset is available for use' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  availabilityPercent?: number;

  @ApiPropertyOptional({ description: 'Name or ID of the last person who operated the asset' })
  @IsString()
  @IsOptional()
  lastOperator?: string;

  // MAINTENANCE
  @ApiPropertyOptional({ description: 'Date the last maintenance was performed (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  lastMaintenanceDate?: string;

  @ApiPropertyOptional({ description: 'Date of the next scheduled maintenance (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ description: 'Planned maintenance budget' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maintenanceBudget?: number;

  // Legacy fields for backward compatibility
  @ApiPropertyOptional({ description: 'Unique asset tag/identifier (legacy)' })
  @IsString()
  @IsOptional()
  assetTag?: string;

  @ApiPropertyOptional({ description: 'Acquisition date (legacy, use purchaseDate instead)' })
  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @ApiPropertyOptional({ description: 'Acquisition cost (legacy, use purchaseValue instead)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  acquisitionCost?: number;

  @ApiPropertyOptional({ description: 'Current value (legacy)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentValue?: number;

  @ApiPropertyOptional({ description: 'Location description (legacy, use currentLocation instead)' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID (legacy)' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Assigned to (operator or department) (legacy)' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ enum: AssetCriticality, default: AssetCriticality.MEDIUM })
  @IsEnum(AssetCriticality)
  @IsOptional()
  criticality?: AssetCriticality;

  @ApiPropertyOptional({ description: 'Expected life in years (legacy)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  expectedLifeYears?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
