# Google Maps API Setup Instructions

## 🔴 CRITICAL SECURITY NOTICE
**The current API key in the repository has NO restrictions and is exposed in source control. This poses a significant security risk and must be addressed immediately.**

## Security Requirements

### 1. Configure API Key Restrictions IMMEDIATELY
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Click on your API key
4. **CRITICAL**: Set up the following restrictions NOW

### 2. Update API Key Restrictions

#### For Local Development
Add these referrers to the allowed list:
- `http://localhost:4200/*`
- `http://localhost/*`
- `http://127.0.0.1:4200/*`
- `http://127.0.0.1/*`

#### For Production
Add your production domain:
- `https://yourdomain.com/*`
- `https://www.yourdomain.com/*`

### 3. Enable Required APIs
Make sure these APIs are enabled:
- Maps JavaScript API
- Places API
- Geocoding API (if needed)

### 4. Alternative: Create a New API Key
If you prefer to use a different key for development:

1. Create a new API key in Google Cloud Console
2. Restrict it to your local development URLs
3. Update the key in `/frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  googleMapsApiKey: 'YOUR_NEW_API_KEY_HERE'
};
```

### 5. Security Best Practices (REQUIRED)
- **CRITICAL**: Never commit unrestricted API keys to repositories
- **CRITICAL**: Always configure domain/referrer restrictions
- **REQUIRED**: Use separate keys for development and production
- **REQUIRED**: Enable only the APIs you actually use:
  - Maps JavaScript API ✅
  - Places API ✅ (if using autocomplete)
  - Disable all other Google APIs
- **RECOMMENDED**: Set daily quota limits in Google Cloud Console
- **RECOMMENDED**: Monitor usage regularly for anomalies
- **RECOMMENDED**: Rotate API keys periodically

### 6. Quota Protection
1. Set daily request quota: 28,000 (within free tier)
2. Enable billing alerts at 80% usage
3. Consider implementing client-side rate limiting

## Testing the Fix
After updating the API key restrictions:
1. Clear your browser cache
2. Restart the Angular development server
3. The map should load without errors

## Note About Other Warnings

### IndexedDB Warnings
The warnings about IndexedDB falling back to localStorage are now fixed. The app will use IndexedDB when available and gracefully fall back to localStorage if not.

### Webcomponents Error
The `mce-autosize-textarea` error appears to be from a browser extension or external script injection, not from the application code. This can be safely ignored.