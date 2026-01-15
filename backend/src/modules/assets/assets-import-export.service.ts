import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as XLSX from 'xlsx';

interface AssetImportRow {
  'Asset Tag'?: string;
  'Asset Name': string;
  'Category': string;
  'Type': string;
  'Manufacturer': string;
  'Model': string;
  'Year Model'?: number;
  'Color'?: string;
  'Company Code': string;
  'Country of Registration'?: string;
  'Current Location'?: string;
  'Serial Number'?: string;
  'Chassis Number'?: string;
  'Engine Number'?: string;
  'Registration Number'?: string;
  'Purchase Date': string;
  'Purchase Value': number;
  'Currency': string;
  'Brand New Value'?: number;
  'Current Market Value'?: number;
  'Residual Value'?: number;
  'Purchase Order'?: string;
  'GL Account'?: string;
  'Install Date': string;
  'End of Life Date': string;
  'Index Type': string;
  'Current Index'?: number;
  'Index at Purchase'?: number;
  'Status'?: string;
  'Notes'?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

@Injectable()
export class AssetsImportExportService {
  private readonly logger = new Logger(AssetsImportExportService.name);

  constructor(private prisma: PrismaService) {}

  async exportTemplate(includeData = false): Promise<Buffer> {
    const headers = [
      'Asset Tag',
      'Asset Name',
      'Category',
      'Type',
      'Manufacturer',
      'Model',
      'Year Model',
      'Color',
      'Company Code',
      'Country of Registration',
      'Current Location',
      'Serial Number',
      'Chassis Number',
      'Engine Number',
      'Registration Number',
      'Purchase Date',
      'Purchase Value',
      'Currency',
      'Brand New Value',
      'Current Market Value',
      'Residual Value',
      'Purchase Order',
      'GL Account',
      'Install Date',
      'End of Life Date',
      'Index Type',
      'Current Index',
      'Index at Purchase',
      'Status',
      'Notes',
    ];

    let data: any[][] = [headers];

    if (includeData) {
      const assets = await this.prisma.asset.findMany({
        orderBy: { createdAt: 'desc' },
      });

      for (const asset of assets) {
        data.push([
          asset.assetTag,
          asset.name,
          asset.category,
          asset.type || '',
          asset.manufacturer || '',
          asset.model || '',
          asset.yearModel || '',
          asset.color || '',
          asset.companyCode || '',
          asset.countryOfRegistration || '',
          asset.currentLocation || '',
          asset.serialNumber || '',
          asset.chassisNumber || '',
          asset.engineNumber || '',
          asset.registrationNumber || '',
          asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
          asset.purchaseValue ? Number(asset.purchaseValue) : '',
          asset.currency || 'USD',
          asset.brandNewValue ? Number(asset.brandNewValue) : '',
          asset.currentMarketValue ? Number(asset.currentMarketValue) : '',
          asset.residualValue ? Number(asset.residualValue) : '',
          asset.purchaseOrder || '',
          asset.glAccount || '',
          asset.installDate ? new Date(asset.installDate).toISOString().split('T')[0] : '',
          asset.endOfLifeDate ? new Date(asset.endOfLifeDate).toISOString().split('T')[0] : '',
          asset.indexType || 'HOURS',
          asset.currentIndex ? Number(asset.currentIndex) : '',
          asset.indexAtPurchase ? Number(asset.indexAtPurchase) : '',
          asset.status,
          asset.notes || '',
        ]);
      }
    } else {
      // Add example row for template
      data.push([
        '', // Asset Tag - auto-generated if empty
        'Excavator CAT 320',
        'Heavy Equipment',
        'Excavator',
        'Caterpillar',
        '320 GC',
        2023,
        'Yellow',
        'EQP001',
        'USA',
        'Site A',
        'CAT320GC123456',
        '',
        '',
        '',
        '2023-01-15',
        250000,
        'USD',
        280000,
        240000,
        50000,
        'PO-2023-001',
        '1500-100',
        '2023-01-20',
        '2033-01-20',
        'HOURS',
        150,
        0,
        'OPERATIONAL',
        'Example asset entry',
      ]);
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 20 }));

    // Add instructions sheet
    const instructionsData = [
      ['Asset Import Template Instructions'],
      [''],
      ['Required Fields:'],
      ['- Asset Name: Name of the asset'],
      ['- Category: Main category (e.g., Heavy Equipment, Vehicle, Tool)'],
      ['- Type: Specific type within category'],
      ['- Manufacturer: Asset manufacturer'],
      ['- Model: Asset model'],
      ['- Company Code: Internal company code'],
      ['- Serial Number OR Registration Number: At least one is required'],
      ['- Purchase Date: Format YYYY-MM-DD'],
      ['- Purchase Value: Numeric value'],
      ['- Currency: USD, EUR, GBP, or XOF'],
      ['- Install Date: Format YYYY-MM-DD'],
      ['- End of Life Date: Format YYYY-MM-DD'],
      ['- Index Type: HOURS, KILOMETERS, MILES, CYCLES, UNITS, or OTHER'],
      [''],
      ['Optional Fields:'],
      ['- Asset Tag: Leave empty for auto-generation'],
      ['- Year Model, Color, Country of Registration, Current Location'],
      ['- Chassis Number, Engine Number'],
      ['- Brand New Value, Current Market Value, Residual Value'],
      ['- Purchase Order, GL Account'],
      ['- Current Index, Index at Purchase'],
      ['- Status: OPERATIONAL, MAINTENANCE, BROKEN, or RETIRED (default: OPERATIONAL)'],
      ['- Notes: Any additional notes'],
      [''],
      ['Tips:'],
      ['- Delete the example row before importing'],
      ['- Dates must be in YYYY-MM-DD format'],
      ['- Numeric values should not include currency symbols'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 80 }];

    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    XLSX.utils.book_append_sheet(wb, ws, 'Assets');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  async importAssets(
    fileBuffer: Buffer,
    actorUserId: string,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames.find(name => name === 'Assets') || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<AssetImportRow>(worksheet);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because row 1 is headers, and we're 0-indexed

        try {
          await this.processRow(row, actorUserId);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: error.message || 'Unknown error',
          });
        }
      }
    } catch (error) {
      this.logger.error('Error parsing Excel file:', error);
      throw new BadRequestException('Invalid Excel file format');
    }

    return result;
  }

  private async processRow(row: AssetImportRow, actorUserId: string): Promise<void> {
    // Validate required fields
    if (!row['Asset Name']) throw new Error('Asset Name is required');
    if (!row['Category']) throw new Error('Category is required');
    if (!row['Type']) throw new Error('Type is required');
    if (!row['Manufacturer']) throw new Error('Manufacturer is required');
    if (!row['Model']) throw new Error('Model is required');
    if (!row['Company Code']) throw new Error('Company Code is required');
    if (!row['Serial Number'] && !row['Registration Number']) {
      throw new Error('Either Serial Number or Registration Number is required');
    }
    if (!row['Purchase Date']) throw new Error('Purchase Date is required');
    if (!row['Purchase Value']) throw new Error('Purchase Value is required');
    if (!row['Currency']) throw new Error('Currency is required');
    if (!row['Install Date']) throw new Error('Install Date is required');
    if (!row['End of Life Date']) throw new Error('End of Life Date is required');
    if (!row['Index Type']) throw new Error('Index Type is required');

    // Validate Index Type
    const validIndexTypes = ['HOURS', 'KILOMETERS', 'MILES', 'CYCLES', 'UNITS', 'OTHER'];
    if (!validIndexTypes.includes(row['Index Type'].toUpperCase())) {
      throw new Error(`Invalid Index Type. Must be one of: ${validIndexTypes.join(', ')}`);
    }

    // Validate Status if provided
    const validStatuses = ['OPERATIONAL', 'MAINTENANCE', 'BROKEN', 'RETIRED'];
    const status = row['Status']?.toUpperCase() || 'OPERATIONAL';
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid Status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Generate asset tag if not provided
    let assetTag = row['Asset Tag'];
    if (!assetTag) {
      const timestamp = Date.now().toString().slice(-6);
      const categoryPrefix = row['Category'].substring(0, 3).toUpperCase();
      const companyCodePrefix = row['Company Code'].substring(0, 3).toUpperCase();
      assetTag = `${companyCodePrefix}-${categoryPrefix}-${timestamp}`;
    }

    // Check if asset tag already exists
    const existing = await this.prisma.asset.findUnique({
      where: { assetTag },
    });
    if (existing) {
      throw new Error(`Asset tag '${assetTag}' already exists`);
    }

    // Parse dates
    const purchaseDate = this.parseDate(row['Purchase Date']);
    const installDate = this.parseDate(row['Install Date']);
    const endOfLifeDate = this.parseDate(row['End of Life Date']);

    // Create asset
    await this.prisma.asset.create({
      data: {
        assetTag,
        name: row['Asset Name'],
        category: row['Category'],
        type: row['Type'],
        family: `${row['Category']}-${row['Type']}`.toUpperCase(),
        manufacturer: row['Manufacturer'],
        model: row['Model'],
        yearModel: row['Year Model'] ? Number(row['Year Model']) : null,
        color: row['Color'] || null,
        companyCode: row['Company Code'],
        countryOfRegistration: row['Country of Registration'] || null,
        currentLocation: row['Current Location'] || null,
        serialNumber: row['Serial Number'] || null,
        chassisNumber: row['Chassis Number'] || null,
        engineNumber: row['Engine Number'] || null,
        registrationNumber: row['Registration Number'] || null,
        purchaseDate,
        purchaseValue: row['Purchase Value'],
        currency: row['Currency'],
        brandNewValue: row['Brand New Value'] ? Number(row['Brand New Value']) : null,
        currentMarketValue: row['Current Market Value'] ? Number(row['Current Market Value']) : null,
        residualValue: row['Residual Value'] ? Number(row['Residual Value']) : null,
        purchaseOrder: row['Purchase Order'] || null,
        glAccount: row['GL Account'] || null,
        installDate,
        endOfLifeDate,
        indexType: row['Index Type'].toUpperCase() as any,
        currentIndex: row['Current Index'] ? Number(row['Current Index']) : null,
        indexAtPurchase: row['Index at Purchase'] ? Number(row['Index at Purchase']) : null,
        status: status as any,
        statusSince: new Date(),
        criticality: 'MEDIUM',
        notes: row['Notes'] || null,
        // Legacy fields
        acquisitionDate: purchaseDate,
        acquisitionCost: row['Purchase Value'],
        currentValue: row['Current Market Value'] ? Number(row['Current Market Value']) : row['Purchase Value'],
        location: row['Current Location'] || null,
        history: {
          create: {
            eventType: 'CREATED',
            actorUserId,
            metadataJson: {
              assetTag,
              name: row['Asset Name'],
              source: 'EXCEL_IMPORT',
            },
          },
        },
      },
    });
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) throw new Error('Invalid date');

    // Handle Excel serial date numbers
    if (typeof dateStr === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateStr * 86400000);
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD format.`);
    }
    return date;
  }
}
