import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, catchError, of } from 'rxjs';
/// <reference path="../../types/speech.d.ts" />
import { LocationService } from '../../core/services/location.service';
import { LocationSearchResult } from '@shared/models/location.model';
import { HttpClient } from '@angular/common/http';
import { sanitizeSearchQuery, sanitizeHtml } from '@shared/utils/sanitize.util';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="search-container">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search for a location</mat-label>
        <input
          matInput
          [formControl]="searchControl"
          [matAutocomplete]="auto"
          placeholder="Enter city, ZIP code, or coordinates"
          (keyup.enter)="onEnterKey()"
        />
        <mat-icon matPrefix>search</mat-icon>
        @if (isSearching()) {
          <mat-spinner matSuffix diameter="20"></mat-spinner>
        }
        @if (!isSearching() && searchControl.value) {
          <button mat-icon-button matSuffix (click)="clearSearch()">
            <mat-icon>clear</mat-icon>
          </button>
        }
        @if (!isSearching() && !searchControl.value && isVoiceSupported()) {
          <button mat-icon-button matSuffix (click)="startVoiceSearch()" [disabled]="isRecording()">
            <mat-icon [class.recording]="isRecording()">
              {{ isRecording() ? 'mic' : 'mic_none' }}
            </mat-icon>
          </button>
        }
        @if (searchError()) {
          <mat-error>{{ searchError() }}</mat-error>
        }
      </mat-form-field>

      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onLocationSelected($event)">
        @for (location of searchResults(); track location.name + location.lat) {
          <mat-option [value]="location">
            <div class="location-option">
              <span class="location-name">{{ location.name }}</span>
              <span class="location-details">
                {{ location.state ? location.state + ', ' : '' }}{{ location.country }}
              </span>
            </div>
          </mat-option>
        } @empty {
          @if (searchControl.value && searchControl.value.length >= 3 && !isSearching()) {
            <mat-option disabled>
              <span class="no-results">No locations found</span>
            </mat-option>
          }
        }
      </mat-autocomplete>
    </div>
  `,
  styles: [`
    .search-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .search-field {
      width: 100%;
      font-size: 16px;
    }

    .location-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .location-name {
      font-weight: 500;
    }

    .location-details {
      font-size: 0.875rem;
      opacity: 0.7;
      margin-left: 8px;
    }

    .no-results {
      color: var(--mat-option-label-text-color);
      font-style: italic;
    }

    mat-icon.recording {
      color: var(--mat-warn-text-color);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    mat-spinner {
      display: inline-block;
    }
  `]
})
export class SearchComponent implements OnDestroy {
  private http = inject(HttpClient);
  private locationService = inject(LocationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  searchResults = signal<LocationSearchResult[]>([]);
  isSearching = signal(false);
  searchError = signal<string | null>(null);
  isRecording = signal(false);
  
  private recognition: SpeechRecognition | null = null;

  isVoiceSupported = computed(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  });

  constructor() {
    this.setupSearchSubscription();
    this.initializeSpeechRecognition();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  private setupSearchSubscription() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => {
        if (typeof value === 'string') {
          if (value.length < 3) {
            this.searchResults.set([]);
            this.searchError.set(value.length > 0 ? 'Enter at least 3 characters' : null);
            return false;
          }
          return true;
        }
        return false;
      }),
      switchMap(query => {
        this.isSearching.set(true);
        this.searchError.set(null);
        // Sanitize query before sending to API
        const sanitizedQuery = sanitizeSearchQuery(query as string);
        return this.searchLocations(sanitizedQuery).pipe(
          catchError(error => {
            console.error('Search error:', error);
            this.searchError.set('Failed to search locations. Please try again.');
            return of([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.searchResults.set(results);
      this.isSearching.set(false);
    });
  }

  private searchLocations(query: string) {
    return this.http.get<LocationSearchResult[]>(`/api/search/location`, {
      params: { q: query }
    });
  }

  onLocationSelected(event: { option: { value: LocationSearchResult } }) {
    const location = event.option.value as LocationSearchResult;
    this.addLocation(location);
  }

  onEnterKey() {
    const results = this.searchResults();
    if (results.length === 1) {
      this.addLocation(results[0]);
    }
  }

  private addLocation(location: LocationSearchResult) {
    this.locationService.getLocations().pipe(
      switchMap(currentLocations => {
        if (currentLocations.length >= 5) {
          throw new Error('Maximum number of locations (5) reached');
        }
        
        return this.http.post('/api/locations', {
          name: location.name,
          latitude: location.lat,
          longitude: location.lon,
          country: location.country,
          state: location.state
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open(`${location.name} added successfully`, 'Close', {
          duration: 3000
        });
        this.router.navigate(['/']);
      },
      error: (error) => {
        const message = error.error?.message || error.message || 'Failed to add location';
        this.snackBar.open(message, 'Close', {
          duration: 5000
        });
      }
    });
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.searchResults.set([]);
    this.searchError.set(null);
  }

  private initializeSpeechRecognition() {
    if (!this.isVoiceSupported()) {
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecording.set(true);
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      // Sanitize voice input before setting it
      const sanitizedTranscript = sanitizeSearchQuery(transcript);
      this.searchControl.setValue(sanitizedTranscript);
      this.isRecording.set(false);
    };

    this.recognition.onerror = (event: SpeechRecognitionError) => {
      console.error('Speech recognition error:', event.error);
      this.isRecording.set(false);
      
      if (event.error === 'not-allowed') {
        this.snackBar.open('Microphone access denied. Please enable microphone permissions.', 'Close', {
          duration: 5000
        });
      } else {
        this.snackBar.open('Voice search failed. Please try again.', 'Close', {
          duration: 3000
        });
      }
    };

    this.recognition.onend = () => {
      this.isRecording.set(false);
    };
  }

  startVoiceSearch() {
    if (this.recognition && !this.isRecording()) {
      this.recognition.start();
    }
  }
}