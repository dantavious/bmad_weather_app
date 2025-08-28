import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { LocationsController } from './locations.controller';
import { LocationService } from '../services/location.service';
import { WeatherLocation } from '@shared/models/location.model';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: LocationService;

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
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationService,
          useValue: {
            findAll: jest.fn().mockReturnValue(of(mockLocations)),
            findById: jest.fn((id) =>
              of(mockLocations.find((loc) => loc.id === id)),
            ),
            findByCoordinates: jest.fn((lat, lon) =>
              of(
                mockLocations.find(
                  (loc) =>
                    Math.abs(loc.latitude - lat) < 0.01 &&
                    Math.abs(loc.longitude - lon) < 0.01,
                ),
              ),
            ),
          },
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    service = module.get<LocationService>(LocationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of locations', (done) => {
      controller.findAll().subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0].name).toBe('New York, NY');
        expect(service.findAll).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('findById', () => {
    it('should return a location by id', (done) => {
      controller.findById('1').subscribe((result) => {
        expect(result).toEqual(mockLocations[0]);
        done();
      });
    });

    it('should return undefined for non-existent id', (done) => {
      controller.findById('999').subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });
  });

  describe('findByCoordinates', () => {
    it('should return a location by coordinates', (done) => {
      controller
        .findByCoordinates('40.7128', '-74.0060')
        .subscribe((result) => {
          expect(result).toEqual(mockLocations[0]);
          done();
        });
    });
  });
});
