import type { Weather } from '@/src/core/schemas';
import { MOCK_WEATHER } from '@/src/data/mock';
import type { IWeatherRepository } from '@/src/data/repositories/IWeatherRepository';

export class MockWeatherRepository implements IWeatherRepository {
  async getCurrent(): Promise<Weather> {
    return MOCK_WEATHER;
  }
}
