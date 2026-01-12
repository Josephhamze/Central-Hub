import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UsePipes,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Companies')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
@UseInterceptors(ResponseInterceptor)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('companies:view')
  @ApiOperation({ summary: 'Get all companies' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of companies' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.companiesService.findAll(+page, +limit, search);
  }

  @Post('upload-logo')
  @UseGuards(RbacGuard)
  @Permissions('companies:update')
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, transform: false })) // Skip validation for file uploads
  @UseInterceptors(FileInterceptor('logo', {
    storage: undefined, // Use memory storage (default) to get buffer
    limits: { 
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Log incoming file info
      console.log('File interceptor - received file:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        encoding: file.encoding,
      });

      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        // fileFilter expects a standard Error, not HttpException
        cb(new Error(`File must be an image (PNG, JPG, JPEG, SVG, or WEBP). Received: ${file.mimetype}`), false);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload company logo' })
  @ApiResponse({ status: 201, description: 'Logo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or missing file' })
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    console.log('uploadLogo called, file:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer,
    } : 'null');

    if (!file) {
      throw new BadRequestException('No file uploaded. Please select an image file.');
    }

    // Validate file size (max 5MB) - multer should handle this, but double-check
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(`File size must be less than 5MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Validate file buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty. Please try uploading again.');
    }

    try {
      return await this.companiesService.uploadLogo(file);
    } catch (error: any) {
      console.error('Logo upload error:', error);
      throw new BadRequestException(error.message || 'Failed to upload logo');
    }
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('companies:view')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company details' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('companies:create')
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  async create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('companies:update')
  @ApiOperation({ summary: 'Update a company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('companies:delete')
  @ApiOperation({ summary: 'Delete a company' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
