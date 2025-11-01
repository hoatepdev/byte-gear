import {
  Get,
  Put,
  Post,
  Body,
  Query,
  Param,
  Delete,
  Request,
  UseGuards,
  Controller,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';

import { ProductService } from './product.service';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { QueryRelatedProductDto } from './dto/query-related-product.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import { EditCommentDto } from './dto/edit-comment.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  @ApiBody({ type: CreateProductDto })
  create(@Body() dto: CreateProductDto, @UploadedFiles() files: Express.Multer.File[]) {
    return this.productService.create(dto, files);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', required: true })
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  @ApiBody({ type: UpdateProductDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productService.update(id, dto, files);
  }

  @Get()
  async findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll({
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search,
      sortBy: query.sortBy,
      fields: query.fields,
      category: query.category,
      event: query.event,
      attributesRaw: query.attributes,
    });
  }

  @Get('related/:id')
  @ApiParam({ name: 'id', required: true })
  findRelated(
    @Param('id') id: string,
    @Query() query: QueryRelatedProductDto,
  ) {
    return this.productService.findRelated(id, {
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search,
      sortBy: query.sortBy,
      fields: query.fields,
    });
  }

  @Get('slug/:slug')
  @ApiParam({ name: 'slug', required: true })
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiParam({ name: 'id', required: true })
  delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Post('comment/:id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        rating: { type: 'number' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          minItems: 0,
        },
      },
      required: ['content', 'rating'],
    },
  })
  async comment(
    @Param('id') productId: string,
    @Body() dto: CreateCommentDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.productService.comment(productId, userId, dto, files);
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Post('comment/:productId/:commentId/like')
  async toggleLikeComment(
    @Param('productId') productId: string,
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.productService.toggleLikeComment(productId, commentId, userId);
  }

  @Post('comment/:productId/:commentId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  @ApiBody({ type: ReplyCommentDto })
  async replyComment(
    @Param('productId') productId: string,
    @Param('commentId') parentCommentId: string,
    @Body() dto: ReplyCommentDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.productService.replyComment(
      productId,
      parentCommentId,
      userId,
      dto.content,
      files,
    );
  }

  @Put('comment/:productId/:commentId')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  @ApiBody({ type: EditCommentDto })
  async editComment(
    @Param('productId') productId: string,
    @Param('commentId') commentId: string,
    @Body() dto: EditCommentDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.productService.editComment(
      productId,
      commentId,
      userId,
      dto.content,
      files,
      dto.oldImages || [],
    );
  }

  @Delete('comment/:productId/:commentId')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'productId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  async deleteComment(
    @Param('productId') productId: string,
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.productService.deleteComment(productId, commentId, userId);
  }
}
