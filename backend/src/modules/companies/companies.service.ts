import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string) {
    // Convert string query params to numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : (typeof page === 'number' ? page : 1);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (typeof limit === 'number' ? limit : 20);
    const skip = (pageNum - 1) * limitNum;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { legalName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        projects: {
          where: { isActive: true },
          select: { id: true, name: true, code: true },
        },
        warehouses: {
          where: { isActive: true },
          select: { id: true, name: true, locationCity: true },
        },
        _count: {
          select: {
            quotes: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async create(dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Prepare update data - handle null values explicitly
    const updateData: any = {};
    Object.keys(dto).forEach((key) => {
      const value = (dto as any)[key];
      // Include null values explicitly (to allow clearing fields like logoUrl)
      if (value === null || value !== undefined) {
        updateData[key] = value;
      }
    });

    return this.prisma.company.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            warehouses: true,
            quotes: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company._count.projects > 0 || company._count.warehouses > 0 || company._count.quotes > 0) {
      throw new BadRequestException(
        'Cannot delete company with associated projects, warehouses, or quotes',
      );
    }

    return this.prisma.company.delete({
      where: { id },
    });
  }

  async uploadLogo(file: Express.Multer.File) {
    try {
      // Validate file buffer exists
      if (!file.buffer) {
        throw new BadRequestException('File buffer is missing');
      }

      // Create uploads directory if it doesn't exist
      // Note: Directory should already exist from Dockerfile, but create it if needed
      const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
      try {
        // Check if directory exists first
        try {
          await fs.promises.access(uploadsDir);
          // Directory exists, we're good
        } catch {
          // Directory doesn't exist, try to create it
          await fs.promises.mkdir(uploadsDir, { recursive: true, mode: 0o755 });
        }
      } catch (mkdirError: any) {
        // If directory creation fails, check if it exists now (race condition)
        try {
          await fs.promises.access(uploadsDir);
          // Directory exists now, we're good (another process created it)
        } catch {
          // Directory still doesn't exist and we can't create it
          console.error(`Failed to create uploads directory: ${mkdirError.message}`, mkdirError);
          throw new BadRequestException(`Failed to create uploads directory: ${mkdirError.message}. Please ensure the uploads directory exists with proper permissions.`);
        }
      }

      // Generate unique filename
      const fileExt = path.extname(file.originalname || '.png');
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file using promises for better error handling
      await fs.promises.writeFile(filePath, file.buffer);

      // Return URL path (will be served as static file)
      const logoUrl = `/api/v1/uploads/logos/${fileName}`;
      
      return { logoUrl };
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      throw new BadRequestException(`Failed to upload logo: ${error.message || 'Unknown error'}`);
    }
  }
}
