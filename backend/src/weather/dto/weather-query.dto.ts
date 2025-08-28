import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class WeatherQueryDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Transform(({ value }) => parseFloat(value))
  longitude: number;
}