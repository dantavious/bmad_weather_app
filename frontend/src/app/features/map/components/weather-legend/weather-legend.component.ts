import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { WeatherLayerService, WeatherLayerType } from '../../../../core/services/weather-layer.service';

interface LegendScale {
  color: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-weather-legend',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './weather-legend.component.html',
  styleUrls: ['./weather-legend.component.scss']
})
export class WeatherLegendComponent {
  private weatherLayerService = inject(WeatherLayerService);
  
  activeLayers = this.weatherLayerService.activeLayers;
  activeLayer = this.weatherLayerService.activeLayer; // For backward compatibility
  
  // Computed property for legend visibility
  showLegend = computed(() => {
    return this.activeLayers().length > 0;
  });
  
  // Computed property for current legend data (shows first active layer)
  legendData = computed(() => {
    const layers = this.activeLayers();
    if (layers.length === 0) return null;
    
    // Show legend for the first active layer
    return this.getLegendData(layers[0]);
  });
  
  // Get all active legends for display
  allLegendData = computed(() => {
    const layers = this.activeLayers();
    return layers.map(layer => this.getLegendData(layer));
  });
  
  private getLegendData(layerType: WeatherLayerType): { title: string; icon: string; scale: LegendScale[] } {
    switch (layerType) {
      case 'temp_new':
        return {
          title: 'Temperature',
          icon: 'thermostat',
          scale: [
            { color: '#1e40af', label: 'Very Cold', value: '< -10°C' },
            { color: '#2563eb', label: 'Cold', value: '-10 to 0°C' },
            { color: '#3b82f6', label: 'Cool', value: '0 to 10°C' },
            { color: '#60a5fa', label: 'Mild', value: '10 to 20°C' },
            { color: '#fbbf24', label: 'Warm', value: '20 to 30°C' },
            { color: '#f59e0b', label: 'Hot', value: '30 to 35°C' },
            { color: '#ef4444', label: 'Very Hot', value: '> 35°C' }
          ]
        };
      
      case 'precipitation_new':
        return {
          title: 'Precipitation',
          icon: 'water_drop',
          scale: [
            { color: '#ffffff', label: 'None', value: '0 mm/h' },
            { color: '#c3f0ff', label: 'Light', value: '0-2.5 mm/h' },
            { color: '#87ceeb', label: 'Moderate', value: '2.5-10 mm/h' },
            { color: '#4682b4', label: 'Heavy', value: '10-50 mm/h' },
            { color: '#1e3a8a', label: 'Very Heavy', value: '> 50 mm/h' }
          ]
        };
      
      case 'clouds_new':
        return {
          title: 'Cloud Coverage',
          icon: 'cloud',
          scale: [
            { color: '#ffffff', label: 'Clear', value: '0-10%' },
            { color: '#f0f0f0', label: 'Few Clouds', value: '10-30%' },
            { color: '#d0d0d0', label: 'Scattered', value: '30-50%' },
            { color: '#a0a0a0', label: 'Broken', value: '50-80%' },
            { color: '#606060', label: 'Overcast', value: '80-100%' }
          ]
        };
      
      default:
        return {
          title: 'Weather',
          icon: 'layers',
          scale: []
        };
    }
  }
  
  getGradient(scale: LegendScale[]): string {
    const colors = scale.map(item => item.color).join(', ');
    return `linear-gradient(to right, ${colors})`;
  }
}