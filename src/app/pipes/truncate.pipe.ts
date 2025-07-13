// src/app/pipes/truncate.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 100): string {
    if (!value) return '';
    
    // Remove HTML tags
    const plainText = value.replace(/<[^>]*>/g, '');
    
    return plainText.length > limit 
      ? plainText.substring(0, limit) + '...' 
      : plainText;
  }
}