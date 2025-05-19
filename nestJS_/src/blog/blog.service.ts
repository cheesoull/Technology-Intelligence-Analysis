import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './blog.entity';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepo: Repository<Blog>,
  ) {}

  async saveBlog(file: Express.Multer.File, data: { title: string; content?: string }) {
    const filePath = file.path;

    const pdfBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(pdfBuffer);
    const lines = parsed.text.trim().split('\n').map(line => line.trim()).filter(Boolean);
    const firstLine = lines[0] || 'Untitled Blog';
    const blog = this.blogRepo.create({
      title: data.title || firstLine,
      filePath: file.path,
      content: '', 
      uploadDate: new Date(),
    });

    return this.blogRepo.save(blog);
    
  }

  async findPaged(page: number, pageSize: number) {
    const [data, total] = await this.blogRepo.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        uploadDate: 'DESC',
      },
    });
  
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize),};
  }

  findOne(id: number) {
    return this.blogRepo.findOne({
      where: { id } 
    });
  }
}
