import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { WeatherLayerService, WeatherLayerType } from '../../../../core/services/weather-layer.service';

@Component({
  selector: 'app-layer-control',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatBottomSheetModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LayerControlComponent {
  weatherLayerService = inject(WeatherLayerService);
  
  // UI state
  isExpanded = signal(false);
  isMobile = signal(false);
  
  constructor() {
    // Check if mobile device
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }
  
  private checkMobile(): void {
    this.isMobile.set(window.innerWidth <= 768);
  }
  
  togglePanel(): void {
    this.isExpanded.update(value => !value);
  }
  
  toggleLayer(layerId: WeatherLayerType): void {
    this.weatherLayerService.toggleLayer(layerId);
    
    // Save to session after toggle
    this.weatherLayerService.saveToSession();
  }
  
  updateOpacity(layerId: WeatherLayerType, opacity: number): void {
    // Convert from 0-100 scale to 0-1
    this.weatherLayerService.updateLayerOpacity(layerId, opacity / 100);
    
    // Save to session after update
    this.weatherLayerService.saveToSession();
  }
  
  getOpacityPercent(layerId: WeatherLayerType): number {
    const config = this.weatherLayerService.getLayerConfig(layerId);
    return config ? config.opacity * 100 : 70;
  }
  
  getLayerIcon(layerId: WeatherLayerType): string {
    switch (layerId) {
      case 'temp_new':
        return 'thermostat';
      case 'precipitation_new':
        return 'water_drop';
      case 'clouds_new':
        return 'cloud';
      default:
        return 'layers';
    }
  }
  
  formatOpacityLabel(value: number): string {
    return `${value}%`;
  }
  
  clearAllLayers(): void {
    // Deactivate all layers
    const layers = this.weatherLayerService.layers();
    layers.forEach(layer => {
      if (layer.active) {
        this.weatherLayerService.toggleLayer(layer.id);
      }
    });
    
    // Save to session
    this.weatherLayerService.saveToSession();
  }
}