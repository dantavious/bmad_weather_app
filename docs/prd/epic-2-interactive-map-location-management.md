# Epic 2: Interactive Map & Location Management

**Goal:** Implement the killer differentiator - an interactive weather map with Google Maps integration, plus enhanced location management features that make the app genuinely useful for technical users monitoring multiple locations.

## Story 2.1: Google Maps Integration

As a user,  
I want to see an interactive map with weather overlays,  
so that I can visually explore weather patterns.

**Acceptance Criteria:**
1. Google Maps displays in dedicated view/component
2. Map initializes centered on user's current location (with permission)
3. Standard map controls (zoom, pan, map type) available
4. Map responsive to screen size with full-screen option
5. Loading state while map initializes
6. Error handling if Google Maps fails to load
7. Map API key stored securely in environment
8. Mobile pinch-to-zoom and drag gestures work smoothly

## Story 2.2: Weather Tile Overlays

As a user,  
I want to see weather data overlaid on the map,  
so that I can understand weather patterns visually.

**Acceptance Criteria:**
1. OpenWeatherMap tile layers display on Google Maps
2. Layer toggle for temperature, precipitation, and clouds
3. Legend shows scale for current overlay
4. Opacity slider adjusts overlay transparency
5. Smooth tile loading without flickering
6. Tiles cache to reduce API calls
7. Material 3 FAB opens layer controls
8. Selected layers persist in session

## Story 2.3: Click-Anywhere Weather Details

As a user,  
I want to click any point on the map to see weather details,  
so that I can explore conditions at specific locations.

**Acceptance Criteria:**
1. Click/tap on map triggers weather fetch for coordinates
2. Material 3 bottom sheet displays weather details
3. Details include temperature, conditions, wind, humidity
4. "Add to Dashboard" button if under location limit
5. Loading indicator during data fetch
6. Reverse geocoding shows approximate address
7. Recent clicked locations stored temporarily
8. Mobile long-press shows context menu

## Story 2.4: Location Management and Reordering

As a user,  
I want to manage and reorder my saved locations,  
so that I can prioritize the most important ones.

**Acceptance Criteria:**
1. Drag-and-drop reordering on desktop via mouse
2. Touch-and-hold reordering on mobile devices
3. Delete button (with confirmation) removes location
4. Primary location indicator (star icon) settable
5. Location edit allows renaming custom labels
6. Changes persist to IndexedDB immediately
7. Smooth animations during reorder (Material motion)
8. Undo snackbar appears after deletion

## Story 2.5: Current Location Auto-Detection

As a user,  
I want the app to detect my current location,  
so that I can quickly see local weather.

**Acceptance Criteria:**
1. Permission prompt explains why location is needed
2. Geolocation API fetches current coordinates
3. Current location appears as first card (if enabled)
4. Location updates when user moves significantly (> 5km)
5. Manual refresh button updates current location
6. Settings toggle to disable current location
7. Fallback to IP-based location if GPS denied
8. Error message if location services unavailable
