import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller';
import { ActivityService } from '../services/activity.service';
import { ActivityType, Rating } from '../../../../shared/models/activity.model';

describe('ActivityController', () => {
  let controller: ActivityController;
  let activityService: ActivityService;

  const mockActivityService = {
    getRecommendations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [
        {
          provide: ActivityService,
          useValue: mockActivityService,
        },
      ],
    }).compile();

    controller = module.get<ActivityController>(ActivityController);
    activityService = module.get<ActivityService>(ActivityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getActivityRecommendations', () => {
    it('should return recommendations for a location', async () => {
      const lat = '40.7128';
      const lon = '-74.0060';
      const mockRecommendations = [
        {
          activityType: ActivityType.RUNNING,
          rating: Rating.GOOD,
          score: 85,
          bestHours: ['06:00', '07:00'],
          factors: {
            temperature: Rating.GOOD,
            wind: Rating.GOOD,
            precipitation: Rating.GOOD,
            humidity: Rating.FAIR,
            aqi: Rating.GOOD,
          },
        },
        {
          activityType: ActivityType.CYCLING,
          rating: Rating.FAIR,
          score: 65,
          bestHours: ['08:00'],
          factors: {
            temperature: Rating.GOOD,
            wind: Rating.FAIR,
            precipitation: Rating.GOOD,
            humidity: Rating.FAIR,
            aqi: Rating.GOOD,
          },
        },
      ];

      mockActivityService.getRecommendations.mockResolvedValue(
        mockRecommendations,
      );

      const result = await controller.getActivityRecommendations(lat, lon);

      expect(result).toEqual(mockRecommendations);
      expect(activityService.getRecommendations).toHaveBeenCalledWith(
        40.7128,
        -74.006,
        undefined,
        'imperial',
      );
    });

    it('should handle activity settings from query params', async () => {
      const lat = '40.7128';
      const lon = '-74.0060';
      const settings = {
        enabledActivities: [ActivityType.RUNNING, ActivityType.CYCLING],
        showBestHours: true,
      };
      const settingsJson = JSON.stringify(settings);

      mockActivityService.getRecommendations.mockResolvedValue([]);

      await controller.getActivityRecommendations(
        lat,
        lon,
        'metric',
        settingsJson,
      );

      expect(activityService.getRecommendations).toHaveBeenCalledWith(
        40.7128,
        -74.006,
        settings,
        'metric',
      );
    });

    it('should handle invalid settings JSON gracefully', async () => {
      const lat = '40.7128';
      const lon = '-74.0060';
      const invalidJson = 'not-valid-json';

      mockActivityService.getRecommendations.mockResolvedValue([]);

      const result = await controller.getActivityRecommendations(
        lat,
        lon,
        undefined,
        invalidJson,
      );

      expect(result).toEqual([]);
      expect(activityService.getRecommendations).toHaveBeenCalledWith(
        40.7128,
        -74.006,
        undefined,
        'imperial',
      );
    });

    it('should return empty array on service error', async () => {
      const lat = '40.7128';
      const lon = '-74.0060';

      mockActivityService.getRecommendations.mockRejectedValue(
        new Error('Service error'),
      );

      const result = await controller.getActivityRecommendations(lat, lon);

      expect(result).toEqual([]);
    });

    it('should handle invalid coordinates', async () => {
      const lat = 'invalid';
      const lon = 'invalid';

      const result = await controller.getActivityRecommendations(lat, lon);

      expect(result).toEqual([]);
      expect(activityService.getRecommendations).not.toHaveBeenCalled();
    });
  });
});
