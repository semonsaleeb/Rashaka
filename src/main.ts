// import { enableProdMode } from '@angular/core';
// import { bootstrapApplication } from '@angular/platform-browser';
// import { provideHttpClient } from '@angular/common/http';
// import { provideRouter } from '@angular/router';
// import { environment } from './environments/environment';
// import { App } from './app/app';
// import { routes } from './app/app.routes';

// if (environment.production) {
//   enableProdMode();
// }

// bootstrapApplication(App, {
//   providers: [
//     provideHttpClient(),
//     provideRouter(routes)
//   ]
// }).catch((err) => console.error(err));

import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { environment } from './environments/environment';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/interceptors/auth.interceptor'; // ✅ your interceptor

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
}).catch((err) => console.error(err));
