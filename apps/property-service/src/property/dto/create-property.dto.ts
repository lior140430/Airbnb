import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class LocationDto {
    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    street: string;
}

class CoordinatesDto {
    @IsNumber()
    @Type(() => Number)
    lat: number;

    @IsNumber()
    @Type(() => Number)
    lng: number;
}

export class CreatePropertyDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @Type(() => Number)
    price: number;

    @IsObject()
    @ValidateNested()
    @Type(() => LocationDto)
    location: LocationDto;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    maxGuests?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    bedrooms?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    beds?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    bathrooms?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
    amenities?: string[];

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => CoordinatesDto)
    coordinates?: CoordinatesDto;
}
