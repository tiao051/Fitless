import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TodayWorkoutScreen from './TodayWorkoutScreen';
import { WorkoutPlanService } from '../../services/workoutPlanService';
import { WorkoutService } from '../../services/workoutService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/workoutPlanService', () => ({
  WorkoutPlanService: {
    getTodayPlan: jest.fn(),
  },
}));

jest.mock('../../services/workoutService', () => ({
  WorkoutService: {
    getUserWorkoutsByDateRange: jest.fn(),
    createWorkout: jest.fn(),
    deleteWorkout: jest.fn(),
  },
}));

describe('TodayWorkoutScreen states', () => {
  let consoleErrorSpy: jest.SpyInstance;

  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows loading state while plan is being loaded', () => {
    (WorkoutPlanService.getTodayPlan as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<TodayWorkoutScreen navigation={navigation} />);

    expect(screen.getByText("Loading today's workout...")).toBeTruthy();
  });

  it('shows error state and retries', async () => {
    (WorkoutPlanService.getTodayPlan as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        isRestDay: false,
        date: new Date().toISOString(),
        plannedExercises: [],
      });
    (WorkoutService.getUserWorkoutsByDateRange as jest.Mock).mockResolvedValue([]);

    render(<TodayWorkoutScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText("Could not load today's workout")).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText("Today's Workout")).toBeTruthy();
    });
  });

  it('shows empty state and navigates to setup', async () => {
    (WorkoutPlanService.getTodayPlan as jest.Mock).mockResolvedValue({
      isRestDay: false,
      date: new Date().toISOString(),
      plannedExercises: [],
    });
    (WorkoutService.getUserWorkoutsByDateRange as jest.Mock).mockResolvedValue([]);

    render(<TodayWorkoutScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('No exercises planned for today yet.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Set Up Today'));
    expect(navigation.navigate).toHaveBeenCalledWith('EditDayPlan', expect.any(Object));
  });
});
