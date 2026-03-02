import { Controller } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('auth')
@ResponseMessage('User is created')
export class AuthController {}
