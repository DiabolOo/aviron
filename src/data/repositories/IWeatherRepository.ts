import type { Weather } from '@/src/core/schemas';

export interface IWeatherRepository {
  getCurrent(): Promise<Weather>;
}
