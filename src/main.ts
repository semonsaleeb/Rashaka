import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
  import { enableProdMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { environment } from './environments/environment';


bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient()
  ]
}).catch(err => console.error(err));