import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paper } from './paper.entity';

@Injectable()
export class PaperService {
  constructor(
    @InjectRepository(Paper)
    private paperRepo: Repository<Paper>,
  ) {}

  async savePaper(file: Express.Multer.File, data: { title: string; author: string; abstract: string }) {

    const paper = this.paperRepo.create({
      ...data,
      content: '',
      fullText: '',
      filePath: file.path,
      uploadDate: new Date(),
    });
    return this.paperRepo.save(paper);
  }

  async findPaged(page: number, pageSize: number) {
    const [data, total] = await this.paperRepo.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        uploadDate: 'DESC',
      },
    });
  
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize),};
  }
  
  findOne(id: number) {
    return this.paperRepo.findOne({ where: { id } });
  }
}
