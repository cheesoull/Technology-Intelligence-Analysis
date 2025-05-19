import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService){}

    @Post()
    generate(@Body() dto: { sourceType: 'paper' | 'blog'; sourceId: number; content: string }){
        return this.reportService.create(dto.sourceType, dto.sourceId, dto.content);
    }

    @Get(':id')
    getPage(
        @Param('id') id: string,
        @Query('page') page = '1',
        @Query('pageSize') pageSize = '1',
    ){
        return this.reportService.getPage(id, +page, +pageSize);
    }
}
