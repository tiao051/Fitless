import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import EditWeeklyPlanScreen from './EditWeeklyPlanScreen';
import { ExerciseService } from '../../services/exerciseService';
import { WorkoutPlanService } from '../../services/workoutPlanService';

jest.mock('../../services/exerciseService', () => ({
  ExerciseService: {
    getAllExercises: jest.fn(),
  },
}));

jest.mock('../../services/workoutPlanService', () => ({
  WorkoutPlanService: {
    getCurrentWeeklyPlan: jest.fn(),
    saveWeeklyPlan: jest.fn(),
    getCurrentMondayIso: jest.fn(() => new Date().toISOString()),
  },
}));

describe('EditWeeklyPlanScreen states', () => {
  const navigation = {
    goBack: jest.fn(),
  };

  const route = {
    params: { dayIndex: 0 },
  };

  const buildWeeklyResponse = () => ({
    workoutPlanId: 1,
    startDate: new Date().toISOString(),
    dayPlans: [
      {
        dayOfWeek: 0,
        isRestDay: false,
        plannedExercises: [],
      },
    ],
  });

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows loading state while data is loading', () => {
    (WorkoutPlanService.getCurrentWeeklyPlan as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<EditWeeklyPlanScreen route={route} navigation={navigation} />);

    expect(screen.getByText('Loading workout day...')).toBeTruthy();
  });

  it('shows full-screen error state and retries', async () => {
    (WorkoutPlanService.getCurrentWeeklyPlan as jest.Mock)
      .mockRejectedValueOnce(new Error('api failed'))
      .mockResolvedValue(buildWeeklyResponse());
    (ExerciseService.getAllExercises as jest.Mock).mockResolvedValue([]);

    render(<EditWeeklyPlanScreen route={route} navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Could not load workout day')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeTruthy();
    });
  });

  it('shows catalog error state in modal and retries network load', async () => {
    (WorkoutPlanService.getCurrentWeeklyPlan as jest.Mock).mockResolvedValue(buildWeeklyResponse());
    (ExerciseService.getAllExercises as jest.Mock)
      .mockRejectedValueOnce(new Error('api down'))
      .mockResolvedValueOnce([]);

    render(<EditWeeklyPlanScreen route={route} navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Plan your workout')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Tap to choose day setup'));
    fireEvent.press(screen.getByText('🏋️ Training day'));

    fireEvent.press(screen.getByText('+ Add Exercise'));

    await waitFor(() => {
      expect(screen.getByText('Exercise library unavailable')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Retry library load'));

    await waitFor(() => {
      expect(ExerciseService.getAllExercises).toHaveBeenCalledTimes(2);
    });
  });
});
