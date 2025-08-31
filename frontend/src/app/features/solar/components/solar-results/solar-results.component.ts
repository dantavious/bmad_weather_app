import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { SolarCalculationResult, HourlyGeneration } from '../../../../../../../shared/models/solar.model';

@Component({
  selector: 'app-solar-results',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <mat-card class="results-card">
      <mat-card-header>
        <mat-icon mat-card-avatar class="header-icon">insights</mat-icon>
        <mat-card-title>Solar Generation Results</mat-card-title>
        <mat-card-subtitle>Daily generation estimate based on your configuration</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="total-generation">
          <mat-icon class="generation-icon">bolt</mat-icon>
          <div class="generation-value">
            <span class="value">{{ result.totalDailyKwh }}</span>
            <span class="unit">kWh</span>
          </div>
          <div class="generation-label">Total Daily Generation</div>
        </div>

        @if (result.cloudImpact > 0) {
          <div class="cloud-impact">
            <mat-icon>cloud</mat-icon>
            <span>Cloud cover reducing generation by {{ result.cloudImpact }}%</span>
          </div>
        }

        <mat-divider></mat-divider>

        <div class="chart-section">
          <h3>Hourly Generation</h3>
          <div class="chart-container">
            <canvas #chart width="800" height="300"></canvas>
          </div>
        </div>

        <div class="peak-hours-section">
          <h3>
            <mat-icon>wb_sunny</mat-icon>
            Best Solar Hours
          </h3>
          <mat-chip-set aria-label="Peak generation hours">
            @for (hour of result.peakHours; track hour) {
              <mat-chip highlighted color="primary">
                <mat-icon matChipAvatar>schedule</mat-icon>
                {{ hour }}
              </mat-chip>
            }
          </mat-chip-set>
          <p class="peak-hours-hint">
            Schedule high-energy activities during these hours for maximum solar utilization
          </p>
        </div>

        <div class="statistics">
          <div class="stat-item">
            <mat-icon>battery_charging_full</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ getMaxGeneration() }} kWh</span>
              <span class="stat-label">Peak Hour Output</span>
            </div>
          </div>
          <div class="stat-item">
            <mat-icon>access_time</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ getProductiveHours() }} hours</span>
              <span class="stat-label">Productive Hours</span>
            </div>
          </div>
          <div class="stat-item">
            <mat-icon>flash_on</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ getAverageGeneration() }} kWh</span>
              <span class="stat-label">Average Hourly</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .results-card {
      margin-top: 24px;
    }

    .header-icon {
      background-color: var(--mat-app-primary);
      color: var(--mat-app-on-primary);
    }

    .total-generation {
      text-align: center;
      padding: 32px 16px;
      background: linear-gradient(135deg, 
        rgba(var(--mat-app-primary-rgb), 0.1) 0%, 
        rgba(var(--mat-app-primary-rgb), 0.05) 100%);
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .generation-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-app-primary);
      margin-bottom: 16px;
    }

    .generation-value {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .generation-value .value {
      font-size: 48px;
      font-weight: 700;
      color: var(--mat-app-primary);
    }

    .generation-value .unit {
      font-size: 24px;
      font-weight: 500;
      color: var(--mat-app-on-surface-variant);
    }

    .generation-label {
      font-size: 16px;
      color: var(--mat-app-on-surface-variant);
    }

    .cloud-impact {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background-color: var(--mat-app-surface-container-high);
      border-radius: 8px;
      margin-bottom: 24px;
      color: var(--mat-app-on-surface-variant);
    }

    .cloud-impact mat-icon {
      color: var(--mat-app-tertiary);
    }

    mat-divider {
      margin: 24px 0;
    }

    .chart-section {
      margin: 24px 0;
    }

    .chart-section h3 {
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 500;
    }

    .chart-container {
      overflow-x: auto;
      padding: 16px;
      background-color: var(--mat-app-surface-container);
      border-radius: 8px;
    }

    canvas {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .peak-hours-section {
      margin: 24px 0;
    }

    .peak-hours-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 500;
    }

    .peak-hours-section h3 mat-icon {
      color: var(--mat-app-primary);
    }

    .peak-hours-hint {
      margin-top: 12px;
      font-size: 14px;
      color: var(--mat-app-on-surface-variant);
    }

    .statistics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: var(--mat-app-surface-container);
      border-radius: 8px;
    }

    .stat-item mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--mat-app-primary);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: var(--mat-app-on-surface);
    }

    .stat-label {
      font-size: 12px;
      color: var(--mat-app-on-surface-variant);
      margin-top: 2px;
    }

    @media (max-width: 600px) {
      .generation-value .value {
        font-size: 36px;
      }

      .generation-value .unit {
        font-size: 20px;
      }

      .statistics {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SolarResultsComponent implements AfterViewInit, OnChanges {
  @Input() result!: SolarCalculationResult;
  @ViewChild('chart', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    this.drawChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['result'] && !changes['result'].firstChange) {
      this.drawChart();
    }
  }

  getMaxGeneration(): string {
    const max = Math.max(...this.result.hourlyGeneration.map((h: HourlyGeneration) => h.kwh));
    return max.toFixed(2);
  }

  getProductiveHours(): number {
    return this.result.hourlyGeneration.filter((h: HourlyGeneration) => h.kwh > 0).length;
  }

  getAverageGeneration(): string {
    const productiveHours = this.result.hourlyGeneration.filter((h: HourlyGeneration) => h.kwh > 0);
    if (productiveHours.length === 0) return '0';
    const sum = productiveHours.reduce((acc: number, h: HourlyGeneration) => acc + h.kwh, 0);
    return (sum / productiveHours.length).toFixed(2);
  }

  private drawChart() {
    if (!this.chartCanvas) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Find max value for scaling
    const maxValue = Math.max(...this.result.hourlyGeneration.map((h: HourlyGeneration) => h.kwh));
    const yScale = maxValue > 0 ? chartHeight / maxValue : 1;
    const barWidth = chartWidth / 24;

    // Get colors from CSS variables
    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue('--mat-app-primary') || '#6750A4';
    const surfaceVariant = style.getPropertyValue('--mat-app-surface-variant') || '#E7E0EC';
    const onSurfaceVariant = style.getPropertyValue('--mat-app-on-surface-variant') || '#49454F';

    // Draw grid lines
    ctx.strokeStyle = surfaceVariant;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = onSurfaceVariant;
      ctx.font = '12px Roboto';
      ctx.textAlign = 'right';
      const value = maxValue * (1 - i / 5);
      ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
    }

    ctx.setLineDash([]);

    // Draw bars
    this.result.hourlyGeneration.forEach((hour: HourlyGeneration, index: number) => {
      const x = padding.left + index * barWidth;
      const barHeight = hour.kwh * yScale;
      const y = padding.top + chartHeight - barHeight;

      // Determine if this is a peak hour
      const isPeakHour = this.result.peakHours.includes(hour.hour);

      // Draw bar
      ctx.fillStyle = isPeakHour ? primaryColor : surfaceVariant;
      ctx.fillRect(x + barWidth * 0.1, y, barWidth * 0.8, barHeight);

      // Draw hour labels (every 3 hours)
      if (index % 3 === 0) {
        ctx.fillStyle = onSurfaceVariant;
        ctx.font = '12px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(hour.hour, x + barWidth / 2, padding.top + chartHeight + 20);
      }
    });

    // Draw axes
    ctx.strokeStyle = onSurfaceVariant;
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // Labels
    ctx.fillStyle = onSurfaceVariant;
    ctx.font = '14px Roboto';
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Generation (kWh)', 0, 0);
    ctx.restore();

    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillText('Hour of Day', padding.left + chartWidth / 2, rect.height - 5);
  }
}