import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ReplyCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}
