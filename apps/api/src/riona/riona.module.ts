import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RionaService } from './riona.service';
import { RionaController } from './riona.controller';

@Module({
    imports: [HttpModule],
    controllers: [RionaController],
    providers: [RionaService],
    exports: [RionaService],
})
export class RionaModule {}
