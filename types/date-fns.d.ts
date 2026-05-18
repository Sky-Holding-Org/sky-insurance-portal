declare module 'date-fns' {
  export function format(date: Date | number, formatStr: string, options?: any): string;
  export function formatDistanceToNow(date: Date | number, options?: any): string;
}
