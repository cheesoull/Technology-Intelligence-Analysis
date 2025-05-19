import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paper } from './paper.entity';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';

@Injectable()
export class PaperService {
  constructor(
    @InjectRepository(Paper)
    private paperRepo: Repository<Paper>,
  ) {}

  async savePaper(file: Express.Multer.File, data: { title: string; author: string; abstract: string }) {
    const filePath = file.path;

    const pdfBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(pdfBuffer);
    const lines = parsed.text.trim().split('\n').map(line => line.trim()).filter(Boolean);
    const firstLine = lines[0] || 'Untitled Paper';

    const paper = this.paperRepo.create({
      title: data.title || firstLine,
      author: data.author,
      abstract: data.abstract,
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
