import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService){}

    @Post('ask')
    async ask(@Body() body:{
        sourceType: 'paper' | 'blog',
        sourceId: number,
        userQuestion: string,
    }){
        return this.chatService.askReport(body.sourceType, body.sourceId,body.userQuestion);
    }

    @Post('stream')
    stream(@Body() dto: { sourceType: 'paper'|'blog'; sourceId: number }) {
        this.chatService.streamAsk(dto.sourceType, dto.sourceId);
        return { message: 'Streaming started' };
    }
}
