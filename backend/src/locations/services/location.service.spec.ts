import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { LocationService } from './location.service';
import { LocationRepository } from '../repositories/location.repository';
import { WeatherLocation } from '@shared/models/location.model';

describe('LocationService', () => {
  let service: LocationService;
  let repository: LocationRepository;

  const mockLocations: WeatherLocation[] = [
    {
      id: '1',
      name: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.006,
      isPrimary: true,
      order: 0,
      createdAt: new Date(),
      settings: {
        alertsEnabled: true,
        units: 'imperial',
      },
    },
    {
      id: '2',
      name: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437,
      isPrimary: false,
      order: 1,
      createdAt: new Date(),
      settings: {
        alertsEnabled: true,
        units: 'imperial',
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: LocationRepository,
          useValue: {
            findAll: jest.fn().mockReturnValue(of(mockLocations)),
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    repository = module.get<LocationRepository>(LocationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all locations from repository', (done) => {
      service.findAll().subscribe((result) => {
        expect(result).toEqual(mockLocations);
        expect(repository.findAll).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('findById', () => {
    it('should return location with matching id', (done) => {
      service.findById('1').subscribe((result) => {
        expect(result).toEqual(mockLocations[0]);
        done();
      });
    });

    it('should return undefined for non-existent id', (done) => {
      service.findById('999').subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });
  });

  describe('findByCoordinates', () => {
    it('should return location with matching coordinates', (done) => {
      service.findByCoordinates(40.7128, -74.006).subscribe((result) => {
        expect(result).toEqual(mockLocations[0]);
        done();
      });
    });

    it('should return location with coordinates within tolerance', (done) => {
      service.findByCoordinates(40.7125, -74.0058).subscribe((result) => {
        expect(result).toEqual(mockLocations[0]);
        done();
      });
    });

    it('should return undefined for non-matching coordinates', (done) => {
      service.findByCoordinates(0, 0).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });
  });
});
