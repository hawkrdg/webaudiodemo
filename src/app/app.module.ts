import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from '@angular/forms';


// material imports...
//
import { MatButtonModule } from "@angular/material/button";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';

// app components
//
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
		CommonModule,
		BrowserAnimationsModule,
		FormsModule,
		MatButtonModule,
		MatSlideToggleModule,
		MatSliderModule,
  ],
  providers: [],
  bootstrap: [
		AppComponent
	]
})
export class AppModule { }
