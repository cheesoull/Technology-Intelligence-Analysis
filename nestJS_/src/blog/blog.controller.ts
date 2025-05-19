import { Controller, Get, Post, Param, Body, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file',{
      storage: diskStorage({
        destination: './uploads/blogs',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )

  async uploadBlog(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string },
  ) {
    return this.blogService.saveBlog(file, {
      title: body.title,
    });
  }

  @Get('list')
  findPaged(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.blogService.findPaged(+page, +pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.blogService.findOne(id);
  }
}
