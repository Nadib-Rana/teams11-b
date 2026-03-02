import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Subscription } from '../generated/prisma/client';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // create subscription
  @Post()
  @ResponseMessage('Create subsciption suncessfully')
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    return this.subscriptionService.create(createSubscriptionDto);
  }

  //get all subsciption
  @Get()
  @ResponseMessage('Get all subsciption suncessfully')
  async findAll(): Promise<Subscription[]> {
    return this.subscriptionService.findAll();
  }

  //get subsciption by the is
  @Get(':id')
  @ResponseMessage('Get one subsciption suncessfully')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Subscription | null> {
    return this.subscriptionService.findOne(id);
  }
}
