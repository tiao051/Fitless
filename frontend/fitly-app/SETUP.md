# Fitly React Native App - Setup Guide

## ⚡ Quick Start (5 minutes)

### Step 1: Ensure Backend is Running

```bash
# Terminal 1 - Start PostgreSQL (if using Docker)
docker-compose -f d:\pet-project\fitly\docker-compose.yml up

# Terminal 2 - Start API Server
cd d:\pet-project\fitly\backend\Fitly.API
dotnet run
```

Expected output: `http://localhost:5062`

### Step 2: Install Frontend Dependencies

```bash
cd d:\pet-project\fitly\frontend\fitly-app
npm install
```

Takes ~2-3 minutes depending on internet speed.

### Step 3: Start Expo Server

```bash
npm start
```

You'll see:
```
Expo Go comes with plan...
› Press 'a' for Android
› Press 'i' for iOS  
› Press 'w' for web
› Press 'q' to quit
```

### Step 4: Choose How to Test

**Option A: Web (Easiest for Testing)**
```
Press 'w' in terminal
→ Opens http://localhost:19006
```

**Option B: Emulator**
```
Press 'a' (Android) or 'i' (iOS)
→ Requires emulator to be running
```

**Option C: Physical Phone**
```
1. Install "Expo Go" app from App Store or Google Play
2. Press 'w' to show QR code
3. Scan QR with phone camera
4. App opens in Expo Go
```

---

## 📝 First Test Flow

### 1. Register Account

- Tap "Sign Up"
- Fill in:
  - Email: `test@example.com`
  - Password: `Test123!`
  - First Name: `John`
  - Last Name: `Doe`
- Tap "Sign Up"
- ✅ Should see Home screen with 0 meals logged

### 2. Search Foods

- Tap "Search" tab (bottom)
- Type "chicken" in search box
- Wait for results (should show 8 variants)
- See: "Chicken (Generic)" "Chicken (CHICKEN OF THE SEA)" etc.

### 3. Log Meal

- Tap "Log" tab
- Enter:
  - Food ID: `1` (for Mackerel)
  - Quantity: `100` (grams)
  - Meal Type: `Breakfast`
- Tap "Log Food"
- ✅ Should see success message

### 4. View Daily Summary

- Tap "Home" tab
- Should see:
  - Mackerel (100g) logged
  - Calories: ~154 kcal
  - Protein: ~23g
  - Carbs: 0g
  - Fat: ~6g

### 5. Logout

- Tap "Profile" tab
- Tap "Logout" button
- ✅ Back to Login screen

---

## 🔧 Troubleshooting

### "Cannot connect to API"
```
✓ Check: dotnet run is running on port 5062
✓ Check: PostgreSQL database is running
✓ Check: Network connectivity
✓ Try: Restart both API and Expo server
```

### "ERR_NAME_RESOLUTION_FAILED" on physical device
```
✓ Problem: Phone can't reach localhost
✓ Solution: Use device IP instead
  1. Run: ipconfig (Windows) or ifconfig (Mac)
  2. Find your local IP: 192.168.x.x
  3. Edit src/services/apiClient.ts:
     const API_URL = 'http://192.168.x.x:5062/api';
  4. Restart app
```

### "Food ID 1 not found"
```
✓ Check: Backend FoodSeeder ran successfully
✓ Run: GET http://localhost:5062/api/nutrition/foods
✓ Verify: Should return 1,636 foods
✓ Try: Use ID from response for logging
```

### App Crashes on Login
```
✓ Check: AsyncStorage dependency installed
  npm install @react-native-async-storage/async-storage
✓ Check: JWT token is valid format
✓ Restart: reload Expo (press 'r' in terminal)
```

---

## 📚 File Structure Map

```
fitly-app/
├── App.tsx                    ← Main navigation logic
├── app.json                   ← Expo settings
├── package.json               ← Dependencies
├── tsconfig.json              ← TypeScript config
├── README.md                  ← Full documentation
├── SETUP.md                   ← This file
└── src/
    ├── context/
    │   └── AuthContext.ts     ← Auth state management
    ├── screens/
    │   ├── auth/              ← Login & Register
    │   ├── home/              ← Daily summary
    │   ├── nutrition/         ← Food search, logging
    │   └── profile/           ← User profile & settings
    └── services/
        ├── apiClient.ts       ← HTTP client setup
        ├── authService.ts     ← Auth API calls
        └── nutritionService.ts← Nutrition API calls
```

---

## 🚀 Development Tips

### Live Reload
- Save a file → app reloads automatically
- Edit a screen → see changes instantly

### Debug Mode
```bash
# Press Ctrl+M (Android) or Cmd+D (iOS)
→ Shows debug menu with options like "Element Inspector"
```

### View Logs
```bash
# In terminal where Expo runs:
Logs appear in real-time
Press 'j' to open JavaScript debugger
```

### Reset Everything
```bash
# Stop Expo (press 'q')
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 🎯 Next Development Steps

1. **Add Calorie Goals**
   - Store goal in user profile
   - Calculate % consumed vs goal
   - Show progress bar on Home screen

2. **Add Weekly Summary**
   - new screen "Weekly" tab
   - Graph showing daily trends
   - Weekly totals

3. **Meal History**
   - View past meals by date
   - Delete/edit previously logged meals

4. **Notifications**
   - Remind to log dinner
   - Goal reached alerts

5. **Offline Mode**
   - Cache food list locally
   - Sync when online

---

## 📱 Platform-Specific Notes

### iOS (macOS only)
```bash
npm run ios
```
- Slower first build (5-10 min)
- Requires Xcode installed
- More reliable on physical device

### Android
```bash
npm run android
```
- Requires Android Studio emulator
- Faster to rebuild
- Good for testing

### Web
```bash
npm run web
```
- Best for quick testing
- Full React DevTools support
- Limited mobile features

---

## ✅ Verification Checklist

- [ ] Backend API running on port 5062
- [ ] PostgreSQL contains 1,636 foods
- [ ] React Native dependencies installed
- [ ] Expo server started
- [ ] Can register new account
- [ ] Can search foods
- [ ] Can log meals
- [ ] Can see daily totals
- [ ] Can logout

---

## 🆘 Support

If you encounter issues:

1. **Check logs**: Read terminal output carefully
2. **Restart**: Stop and restart both API and Expo
3. **Clear cache**: `npm start -- --clear`
4. **Reinstall**: `rm -rf node_modules && npm install`
5. **Check backend**: `curl http://localhost:5062/api/nutrition/foods`

For more help, check:
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)

---

Last Updated: March 13, 2026
Fitly Project - React Native Frontend
