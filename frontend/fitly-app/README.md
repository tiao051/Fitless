# Fitly React Native App

A mobile nutrition tracking app built with React Native and Expo.

## Features

- User authentication (Register/Login with JWT)
- Search 1,636 foods by name
- Log meals with quantity per day
- Daily nutrition summary (calories, protein, carbs, fat)
- Bottom tab navigation
- Clean, intuitive UI

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v16+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

## Installation

1. Navigate to the frontend directory:
```bash
cd d:\pet-project\fitly\frontend\fitly-app
```

2. Install dependencies:
```bash
npm install
```

Or with yarn:
```bash
yarn install
```

## API Configuration

Make sure your backend API is running:
```bash
cd d:\pet-project\fitly\backend\Fitly.API
dotnet run
```

The app is configured to connect to `http://localhost:5062/api` by default.

## Running the App

### Start Expo Server:
```bash
npm start
```

This will open the Expo CLI menu with options:

### Option 1: Run on Emulator/Simulator
- **Android**: Press `a` (requires Android Studio emulator)
- **iOS**: Press `i` (requires Xcode, macOS only)

### Option 2: Run on Physical Device
1. Install Expo Go app from App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in terminal with phone camera
3. App will open in Expo Go

### Option 3: Run on Web (for testing)
```bash
npm run web
```

## Project Structure

```
fitly-app/
├── App.tsx                          # Main entry point & navigation
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
└── src/
    ├── context/
    │   └── AuthContext.ts           # Authentication context
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── RegisterScreen.tsx
    │   ├── home/
    │   │   └── HomeScreen.tsx
    │   ├── nutrition/
    │   │   ├── FoodSearchScreen.tsx
    │   │   ├── LogNutritionScreen.tsx
    │   │   └── DailyNutritionScreen.tsx
    │   └── profile/
    │       └── ProfileScreen.tsx
    └── services/
        ├── apiClient.ts             # Axios client with auth headers
        ├── authService.ts           # Auth API calls
        └── nutritionService.ts      # Nutrition API calls
```

## Usage Guide

### 1. Register/Login
- Tap on "Sign Up" to create new account
- Or "Login" if you already have one
- JWT token is automatically saved after successful auth

### 2. Home Tab
- View today's nutrition summary
- See calories, protein, carbs, fat totals
- View all meals logged today
- Quick buttons to log meals or search foods

### 3. Search Tab
- Search for foods by name (e.g., "chicken", "rice", "eggs")
- View 1,636 available foods with brands
- See calories per 100g
- Food details displayed as discovered

### 4. Log Tab
- Enter food ID (found from search)
- Enter quantity in grams
- Select meal type (Breakfast, Lunch, Dinner, Snack)
- Tap "Log Food"

### 5. Summary Tab
- Redirects to Home tab (consolidated view)

### 6. Profile Tab
- View your account info
- See member since date
- Logout option

## Testing the App

### Test Account (if already created):
```
Email: testuser@fitly.com
Password: TestPassword123!
```

### Test Data:
- Food ID 1: Mackerel
- Food ID 2: Scallops
- Try searching: "chicken", "rice", "fish", "eggs"

## Troubleshooting

### Connection Issues
```
Error: Can't reach API
→ Ensure backend API is running (dotnet run)
→ Check API_URL in src/services/apiClient.ts
→ Use device IP instead of localhost if on physical device
```

### AsyncStorage Errors
```
Error: AsyncStorage not found
→ Dependency is included, reinstall: npm install
```

### Picker Issues (Android)
```
Error: Picker not rendering properly
→ May need `@react-native-picker/picker` separate install
```

## Customization

### Change API URL
Edit `src/services/apiClient.ts`:
```typescript
const API_URL = 'http://YOUR_IP:5062/api'; // For physical device
```

### Change Theme Colors
Color scheme uses `#FF6B6B` (red). Update in each screen's `styles` object.

### Add More Screens
1. Create new screen in `src/screens/`
2. Add to App.tsx navigation
3. Import `useAuth` if auth needed

## Build for Production

### Android APK:
```bash
eas build --platform android
```

### iOS IPA:
```bash
eas build --platform ios
```

Requires EAS CLI setup and Apple/Google accounts.

## Useful Commands

```bash
npm start              # Start Expo server
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator
npm run web            # Run on web browser
expo logout            # Logout from Expo
expo prune             # Clean unnecessary files
```

## Dependencies

- **expo**: ^50.0.0 - React Native framework
- **react-native**: 0.73.2 - Mobile framework
- **react-navigation**: ^6.1.9 - Navigation
- **axios**: ^1.6.5 - HTTP client
- **@react-native-async-storage/async-storage**: - Local storage

## Next Steps

1. Setup app structure
2. Implement authentication
3. Food search and logging
4. Add calorie goal tracking
5. Weekly nutrition reports
6. Workout logging
7. Social features

## Support

For issues or questions, check:
- React Navigation docs: https://reactnavigation.org
- Expo docs: https://docs.expo.dev
- React Native docs: https://reactnative.dev

## License

Part of Fitly project
