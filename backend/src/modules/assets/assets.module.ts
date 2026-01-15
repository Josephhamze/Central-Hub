import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetsImportExportService } from './assets-import-export.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssetsController],
  providers: [AssetsService, AssetsImportExportService],
  exports: [AssetsService],
})
export class AssetsModule {}
