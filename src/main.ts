import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { environment } from './environments/environment';
import { App } from './app/app';
import { routes } from './app/app.routes';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes)
  ]
}).catch((err) => console.error(err));