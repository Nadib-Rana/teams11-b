import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseMessage } from './common/decorators/response-message.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ResponseMessage('Hello World!')
  getHello(): string {
    return this.appService.getHello();
  }
}
