import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class SolarIrradianceDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class SolarIrradianceResponseDto {
  latitude: number;
  longitude: number;
  date: Date;
  hourlyIrradiance: number[];
  sunriseHour: number;
  sunsetHour: number;
}