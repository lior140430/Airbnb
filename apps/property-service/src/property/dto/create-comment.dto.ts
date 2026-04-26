import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    text: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;
}
