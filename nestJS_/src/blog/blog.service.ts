import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './blog.entity';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepo: Repository<Blog>,
  ) {}

  async saveBlog(file: Express.Multer.File, data: { title: string; content?: string }) {
    const blog = this.blogRepo.create({
      title: data.title,
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
