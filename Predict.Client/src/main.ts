import {
  enableProdMode,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { AppRouting } from './app/app.routing';
import { environment } from './environments/environment';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    importProvidersFrom(AppRouting),
    importProvidersFrom(NgbModule),
  ],
}).catch((err) => console.error(err));
