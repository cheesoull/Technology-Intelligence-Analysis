import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BlogService } from '../src/blog/blog.service';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const paperService = app.get(BlogService);

  // 从命令行参数获取目录路径，例如 node import-papers.js ../uploads/papers
  const folderPath = process.argv[2];

  if (!folderPath || !fs.existsSync(folderPath)) {
    console.error('请提供有效的目录路径，例如：npm run import:papers ./uploads/papers');
    process.exit(1);
  }

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.pdf'));

  for (const filename of files) {
    const filePath = path.join(folderPath, filename);

    // 读取 PDF 内容
    const pdfBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(pdfBuffer);
    const lines = parsed.text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '未命名博客';

    const fakeFile = {
      path: filePath,
      originalname: filename,
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    try {
        const result = await paperService.saveBlog(fakeFile, {
            title: firstLine,
        });
      
        console.log(`成功导入: ${filename} => ID: ${result.id}`);
      } catch (err) {
        if (err instanceof Error) {
          console.error(`导入失败: ${filename}`, err.message);
        } else {
          console.error(`导入失败: ${filename}`, err);
        }
      }
  }

  await app.close();
}

bootstrap();