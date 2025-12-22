declare module 'csv-parse/sync' {
  export function parse(
    input: string | Buffer,
    options?: {
      columns?: boolean | string[] | ((record: any) => any);
      skip_empty_lines?: boolean;
      trim?: boolean;
      bom?: boolean;
      [key: string]: any;
    },
  ): any[];
}

