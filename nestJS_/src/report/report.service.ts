import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { Repository } from 'typeorm'; 
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(Report)
        private reportRepo: Repository<Report>,        
    ){}

    async create(sourceType: 'paper' | 'blog', sourceId: number, content: string){
        const filename = `${Date.now()}_report.pdf`;
        const filepath = path.join('uploads', 'reports', filename);
        const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'msyh.ttf');

        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(filepath));
        doc.font(fontPath);
        doc.fontSize(12).text(content, { lineGap: 6 });
        doc.end();

        const report = this.reportRepo.create({
            sourceType,
            sourceId,
            content,
        pdfPath: filepath
        });
        return this.reportRepo.save(report);
    }
    async getPage(id: string, page: number, pageSize: number = 1){
        const report = await this.reportRepo.findOne({ where: { id } });
        if (!report) throw new Error('Report not found');
        const paras = report.content.split(/\n(?=\d+\.\s)/g);
        const total = Math.ceil(paras.length / pageSize);
        const slice = paras.slice((page - 1) * pageSize, page * pageSize);
        return { page, pageSize, totalPages: total, content: slice };
    }
}
