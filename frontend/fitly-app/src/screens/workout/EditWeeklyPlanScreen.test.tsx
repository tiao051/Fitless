import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditWeeklyPlanScreen from './EditWeeklyPlanScreen';
import { ExerciseService } from '../../services/exerciseService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/exerciseService', () => ({
  ExerciseService: {
    getAllExercises: jest.fn(),
  },
}));

describe('EditWeeklyPlanScreen states', () => {
  const navigation = {
    goBack: jest.fn(),
  };

  const route = {
    params: { dayIndex: 0 },
  };

  const buildTrainingWeekPlan = () => [
    {
      day: 'Monday',
      exercises: [],
      isRestDay: false,
      dayType: 'training',
      planName: 'Chest Day',
      customPlanLabel: '',
    },
  ];

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows loading state while data is loading', () => {
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<EditWeeklyPlanScreen route={route} navigation={navigation} />);

    expect(screen.getByText('Loading workout day...')).toBeTruthy();
  });

  it('shows full-screen error state and retries', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockRejectedValueOnce(new Error('storage failed'))
      .mockResolvedValue(JSON.stringify(buildTrainingWeekPlan()));
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
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(buildTrainingWeekPlan()));
    (ExerciseService.getAllExercises as jest.Mock)
      .mockRejectedValueOnce(new Error('api down'))
      .mockResolvedValueOnce([]);

    render(<EditWeeklyPlanScreen route={route} navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Plan your workout')).toBeTruthy();
    });

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
