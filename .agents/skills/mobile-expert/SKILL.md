---
name: mobile-expert
description: "Use when: building React Native screens, UI components, state management, API integration, navigation. Tech: React Native 0.81+, Expo 54, TypeScript, React Navigation 6.x, Zustand, Async Storage, NativeWind. Refer to `.github/project-brief.md` for core principles."
---

# Fitly Mobile Guidelines (React Native 0.81.5)

## Tech Stack

### Navigation
- **Framework**: React Navigation 6.x
- **Navigation Patterns**:
  - Bottom Tab Navigator for main sections (Workouts, Nutrition, Profile)
  - Stack Navigator for drilling into details
  - Modal stacks for overlays (food search, plan editing)

### State Management
- **Global Auth**: React Context (`AuthContext`) for user session
- **Local Component State**: useState for form inputs, UI toggles
- **Persistent Cache**: Async Storage for offline support (non-critical data)
- **Planned State**: Zustand for future complex state needs

### Styling
- **Framework**: NativeWind (Tailwind CSS for React Native)
- **Responsive**: Adapt layouts for phone/tablet screens
- **Theme**: Dark/light mode support via NativeWind

### HTTP Client
- **Framework**: Axios with custom base instance
- **Features**:
  - JWT token interceptors (read from Async Storage, append to Authorization header)
  - Auto-refresh on 401 Unauthorized
  - Centralized error handling (show toast/modal on network errors)

---

## Component Architecture

### General Principles
- **Small & Reusable**: Keep components under 200 lines
- **Props Over Global State**: Pass props down; use Context only for auth
- **Functional Components**: Always use hooks (useState, useEffect, useContext)
- **Descriptive Names**: Use full words; `WorkoutCardItem` not `WI`

### Folder Structure
```
src/
├── screens/           (Full-page components)
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── WelcomeScreen.tsx
│   ├── workouts/
│   │   ├── WorkoutPlanScreen.tsx
│   │   ├── TodayWorkoutScreen.tsx
│   │   └── EditWeeklyPlanScreen.tsx
│   ├── nutrition/
│   │   ├── DailyNutritionScreen.tsx
│   │   ├── LogNutritionScreen.tsx
│   │   └── FoodSearchScreen.tsx
│   └── ProfileScreen.tsx
├── components/
│   ├── ui/            (Reusable, dumb components)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   └── domain/        (Feature-specific smart components)
│       ├── WorkoutSetForm.tsx
│       ├── NutritionSummary.tsx
│       └── ...
├── services/          (API clients)
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── workoutService.ts
│   ├── nutritionService.ts
│   └── ...
├── context/           (Global state)
│   └── AuthContext.ts
├── hooks/             (Custom reusable logic)
│   ├── useAuth.ts
│   ├── useWorkouts.ts
│   └── ...
└── utils/             (Helpers, formatters)
    ├── formatters.ts
    ├── validators.ts
    └── ...
```

### UI Component Example Pattern
```typescript
// src/components/ui/Button.tsx
import { Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  const bgColor = variant === 'primary' ? 'bg-blue-600' : 'bg-gray-200';
  return (
    <Pressable
      disabled={disabled}
      className={`${bgColor} px-4 py-2 rounded-lg`}
      onPress={onPress}
    >
      <Text className="text-white font-semibold">{label}</Text>
    </Pressable>
  );
}
```

### Screen Component Example Pattern
```typescript
// src/screens/workouts/TodayWorkoutScreen.tsx
import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { workoutService } from '@services/workoutService';

export function TodayWorkoutScreen() {
  const { user } = useAuth();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodayWorkout();
  }, []);

  async function loadTodayWorkout() {
    try {
      setLoading(true);
      const data = await workoutService.getTodayWorkout(user!.id);
      setWorkout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ActivityIndicator />;
  if (error) return <Text className="text-red-600">{error}</Text>;
  if (!workout) return <Text>No workout today</Text>;

  return (
    <View className="flex-1 bg-white p-4">
      {/* Render workout details */}
    </View>
  );
}
```

---

## API Integration Pattern

### Service Layer Example
```typescript
// src/services/workoutService.ts
import { apiClient } from './apiClient';
import type { Workout, CreateWorkoutDTO } from '@types';

export const workoutService = {
  async getTodayWorkout(userId: string): Promise<Workout> {
    const response = await apiClient.get(`/workoutplans/today`);
    return response.data;
  },

  async createWorkout(dto: CreateWorkoutDTO): Promise<Workout> {
    const response = await apiClient.post(`/users/${dto.userId}/workouts`, dto);
    return response.data;
  },

  // ... other methods
};
```

### Error Handling
- Always wrap API calls in try-catch
- Show user-friendly error messages (not technical stack traces)
- Retry on network errors (show "Retry" button)
- Handle 401 Unauthorized by clearing auth context and redirecting to login

---

## Current Screens

| Screen | Purpose | Tech | Status |
|--------|---------|------|--------|
| `WelcomeScreen` | Landing/splash | Navigation | Built |
| `LoginScreen` | Email/password auth | authService + AsyncStorage | Built |
| `RegisterScreen` | New user signup | authService | Built |
| `ProfileScreen` | User settings | Context | Built |
| `WorkoutPlanScreen` | View weekly plan | workoutPlanService | Built + Tested |
| `EditWeeklyPlanScreen` | Create/modify plan | workoutPlanService | Built + Tested |
| `TodayWorkoutScreen` | Log today's workout | workoutService | Built + Tested |
| `DailyNutritionScreen` | Nutrition dashboard | nutritionService | Built + Tested |
| `LogNutritionScreen` | Log meal entry | nutritionService | Built |
| `FoodSearchScreen` | Search food DB | nutritionService | Built |

---

## Testing

### Jest + React Native Testing Library
```typescript
// __tests__/screens/TodayWorkoutScreen.test.tsx
import { render, screen, waitFor } from '@testing-library/react-native';
import { TodayWorkoutScreen } from '@screens/workouts/TodayWorkoutScreen';
import * as workoutService from '@services/workoutService';

jest.mock('@services/workoutService');

describe('TodayWorkoutScreen', () => {
  it('renders workout data', async () => {
    (workoutService.getTodayWorkout as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Chest Day',
      sets: [],
    });

    render(<TodayWorkoutScreen />);

    await waitFor(() => {
      expect(screen.getByText('Chest Day')).toBeOnTheScreen();
    });
  });

  it('shows error on API failure', async () => {
    (workoutService.getTodayWorkout as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<TodayWorkoutScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/)).toBeOnTheScreen();
    });
  });
});
```

### Test Mocking Pattern
- **Mock API services**: Don't hit real backend in tests
- **Mock Async Storage**: Fake JWT token retrieval
- **Mock Navigation**: Use `@react-navigation/native/testing`

---

## Common Pitfalls to Avoid

1. **Calling API directly in components** → Use service layer
2. **Storing API responses in multiple places** → Single source of truth (backend)
3. **Hardcoding screen names** → Use navigation type guards
4. **Not handling JWT refresh** → Axios interceptor must handle 401
5. **Using AsyncStorage for critical data** → Backend is authoritative
6. **Large component files** → Split into smaller, testable pieces
7. **Ignoring error states** → Every API call needs try-catch + UI feedback

---

## Reference

- Refer to `.github/project-brief.md` for core principles (KISS, TDD, DRY)
- Refer to `backend-expert` skill for API endpoint details
- Refer to `fitness-logic` skill for domain calculations
