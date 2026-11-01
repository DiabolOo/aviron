declare module 'fit-file-parser' {
  export interface FitParserOptions {
    force?: boolean;
    speedUnit?: string;
    lengthUnit?: string;
    temperatureUnit?: string;
    elapsedRecordField?: boolean;
    mode?: 'list' | 'cascade' | 'both';
  }

  export default class FitParser {
    constructor(options?: FitParserOptions);
    parse(
      content: ArrayBuffer | Uint8Array,
      callback: (err: unknown, data: unknown) => void,
    ): void;
  }
}
