import { Injectable } from '@nestjs/common';
import { Paper } from '../paper/paper.entity';
import { Blog } from 'src/blog/blog.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from '../report/report.entity';
import { AutoAgentService } from 'src/auto-agent/auto-agent.service';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Paper) private paperRepo: Repository<Paper>,
        @InjectRepository(Blog) private blogRepo: Repository<Blog>,
        @InjectRepository(Report) private reportRepo: Repository<Report>,
        private readonly agent: AutoAgentService,
    ){}

    async askReport(
        sourceType: 'paper' | 'blog',
        sourceId: number,
        userQuestion: string,
    ){
        const item = sourceType == 'paper' 
        ? await this.paperRepo.findOne({ where: { id: sourceId }}) 
        : await this.blogRepo.findOne({ where: { id: sourceId }});

        if(!item) throw new Error('Source not found');
        const filePath = item.filePath;
        const fullPath = path.join(process.cwd(), filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${fullPath}`);
        }

        const pdfBuffer = fs.readFileSync(fullPath);
        const parsed = await pdfParse(pdfBuffer);
        const context = parsed.text;
        const report = await this.agent.generateReport(userQuestion, context);
        const reportsDir = path.join(process.cwd(), 'uploads/reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        const filename = `${Date.now()}_report.pdf`;
        const filepath = path.join(reportsDir, filename);

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(filepath));
        doc.fontSize(12).text(report);
        doc.end();

        const saved = this.reportRepo.create({
            sourceType,
            sourceId,
            content: report,
            pdfPath: `uploads/reports/${filename}`
        });

        return this.reportRepo.save(saved);
    }

    async streamAsk(sourceType: 'paper'|'blog', sourceId: number) {
        const item = sourceType === 'paper'
          ? await this.paperRepo.findOne({ where: { id: sourceId } })
          : await this.blogRepo.findOne({ where: { id: sourceId } });
        if (!item) throw new Error('Not found');
    
        await this.agent.streamGenerate(item.content,
          chunk => {/* push via gateway */},
          () => {/* end signal */}
        );
    }
}
