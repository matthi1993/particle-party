/*
 *  Protractor support is deprecated in Angular.
 *  Protractor is used in this example for compatibility with Angular documentation tools.
 */
import { bootstrapApplication, provideProtractorTestingSupport } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import {providePrimeNG} from "primeng/config";
import Aura from "@primeng/themes/aura";

bootstrapApplication(AppComponent, {
  providers: [
    provideProtractorTestingSupport(),
    provideAnimationsAsync(),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
}).catch((err) =>
  console.error(err),
);
