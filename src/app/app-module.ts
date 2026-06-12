import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { CoreModule } from './core/core.module';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';

// PrimeNG v21 — tema y módulos globales
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';

@NgModule({
  declarations: [
    App,
    SidebarComponent,
    HeaderComponent,
  ],
  imports: [
    BrowserModule,        // ya re-exporta CommonModule
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
    MenuModule,
    TooltipModule,
    RippleModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    providePrimeNG({ theme: { preset: Aura } }),
  ],
  bootstrap: [App],
})
export class AppModule {}
