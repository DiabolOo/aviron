import type { Weather } from '@/src/core/schemas';
import { MOCK_WEATHER } from '@/src/data/mock';
import type { IWeatherRepository } from '@/src/data/repositories/IWeatherRepository';

export class LocalWeatherRepository implements IWeatherRepository {
  async getCurrent(): Promise<Weather> {
    return MOCK_WEATHER;
  }
}
