# Epic 3: Alerts, Recommendations & PWA Polish

**Goal:** Complete the MVP by adding the intelligent features that differentiate DatDude Weather - precipitation alerts, activity recommendations, and full PWA functionality that makes it feel like a native app.

## Story 3.1: Precipitation Alerts System

As a user,  
I want to receive alerts before rain starts,  
so that I can take action before getting wet.

**Acceptance Criteria:**
1. Push notification permission prompt with clear value proposition
2. Alerts trigger 5-15 minutes before precipitation
3. Notification includes location and time until rain
4. Per-location toggle enables/disables alerts
5. Quiet hours setting prevents overnight alerts
6. NestJS manages notification subscriptions
7. Service worker handles push events
8. Test button verifies notifications working

## Story 3.2: Severe Weather Alerts

As a user,  
I want to know about severe weather warnings,  
so that I can stay safe during dangerous conditions.

**Acceptance Criteria:**
1. NWS alerts fetched for all saved locations
2. Red badge on location card for warnings
3. Yellow badge for watches, blue for advisories
4. Alert details show in expandable panel
5. Push notifications for warning-level alerts only
6. Source attribution "Via National Weather Service"
7. Alerts refresh every 5 minutes when active
8. Historical alerts viewable for 24 hours

## Story 3.3: Smart Activity Recommendations

As a user,  
I want activity recommendations based on weather,  
so that I can plan outdoor activities optimally.

**Acceptance Criteria:**
1. Five activities tracked: Running, Cycling, Gardening, Outdoor Work, Stargazing
2. Each activity shows Good/Fair/Poor rating
3. Ratings based on temperature, wind, precipitation, AQI
4. "Best hours today" highlights optimal times
5. Color-coded chips below each location card
6. Expandable details explain rating factors
7. Settings to enable/disable specific activities
8. Algorithm documented for transparency

## Story 3.4: PWA Installation and Offline Mode

As a user,  
I want to install the app and use it offline,  
so that I have weather data even without connection.

**Acceptance Criteria:**
1. PWA manifest with app name, icons, theme colors
2. Install prompt appears after second visit
3. Service worker caches all static assets
4. Last fetched weather data available offline
5. Offline indicator banner when disconnected
6. Background sync updates data when reconnected
7. App opens in standalone mode when installed
8. Splash screen shows during app launch

## Story 3.5: Solar Calculator Feature

As a user with solar panels,  
I want to estimate daily generation,  
so that I can plan high-energy activities.

**Acceptance Criteria:**
1. Solar calculator accessible from main menu
2. Form inputs: panel wattage, quantity, efficiency
3. Location selector uses saved locations
4. Calculate button estimates daily kWh output
5. Results show hourly generation curve
6. Cloud cover impact displayed as percentage
7. "Best solar hours" highlighted on timeline
8. Calculations use solar irradiance data from API

## Story 3.6: Performance and Polish

As a developer,  
I want the app to meet all performance criteria,  
so that users have a smooth, professional experience.

**Acceptance Criteria:**
1. Lighthouse performance score > 90
2. First Contentful Paint < 1.5 seconds
3. Time to Interactive < 3 seconds
4. All animations run at 60fps
5. No memory leaks during extended use
6. Error tracking configured and working
7. Analytics tracking user interactions
8. All UI text follows Material Design 3 guidelines
