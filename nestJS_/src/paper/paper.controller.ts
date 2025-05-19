import { Controller, Get, Post, Param, Body, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { PaperService } from './paper.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('papers')
export class PaperController {
  constructor(private readonly paperService: PaperService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file',{
      storage: diskStorage({
        destination: './uploads/papers',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )

  async uploadPaper(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; author?: string; abstract?: string },
  ) {
    return this.paperService.savePaper(file, {
      title: body.title,
      author: body.author || '',
      abstract: body.abstract || '',
    });
  }
  

  @Get('list')
  findPaged(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.paperService.findPaged(+page, +pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.paperService.findOne(+id);
  }
}
