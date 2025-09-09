import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';

// Factory function
export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  // ✅ type assertion to satisfy TS
  return new TranslateHttpLoader(http, './assets/i18n/', '.json') as unknown as TranslateLoader;
}
