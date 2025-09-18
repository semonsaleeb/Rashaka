import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  pure: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 30, trail = '...'): string {
    if (!value) return '';
    if (value.length <= limit) return value;
    return value.slice(0, limit) + trail;
  }
}
