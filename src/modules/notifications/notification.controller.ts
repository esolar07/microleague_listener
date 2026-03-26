import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationService } from './notification.service';
import { GetNotificationsDto } from './dto/get-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Retrieve paginated list of notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserNotifications(@Request() req: any, @Query() query: GetNotificationsDto) {
    const userId = req.user?._id?.toString();
    const email = req.user?.email;

    return this.notificationService.getUserNotifications(userId, email, query);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Get the count of unread notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?._id?.toString();
    const email = req.user?.email;

    return this.notificationService.getUnreadCount(userId, email);
  }

  @Put('mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark notifications as read',
    description: 'Mark specific notifications as read by their IDs',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(@Request() req: any, @Body() markReadDto: MarkReadDto) {
    const userId = req.user?._id?.toString();
    const email = req.user?.email;

    return this.notificationService.markAsRead(userId, email, markReadDto.notificationIds);
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications as read for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?._id?.toString();
    const email = req.user?.email;

    return this.notificationService.markAllAsRead(userId, email);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification by its ID',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotificationById(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?._id?.toString();
    const email = req.user?.email;

    return this.notificationService.getNotificationById(id, userId, email);
  }

  @Post()
  @ApiOperation({
    summary: 'Create notification (Admin)',
    description:
      'Create a new notification. This endpoint can be used by admins to send notifications to users.',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created and queued successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createNotification(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.sendNotification({
      userId: createDto.userId,
      email: createDto.email,
      title: createDto.title,
      message: createDto.message,
      type: createDto.type,
      metadata: createDto.metadata,
    });
  }
}
