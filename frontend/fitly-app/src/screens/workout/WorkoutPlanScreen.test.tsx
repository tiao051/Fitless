import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import WorkoutPlanScreen from './WorkoutPlanScreen';
import { WorkoutPlanService } from '../../services/workoutPlanService';

jest.mock('../../services/workoutPlanService', () => ({
  WorkoutPlanService: {
    getCurrentWeeklyPlan: jest.fn(),
  },
}));

describe('WorkoutPlanScreen states', () => {
  let consoleErrorSpy: jest.SpyInstance;

  const navigation = {
    addListener: jest.fn(() => jest.fn()),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows loading state while weekly plan is being loaded', () => {
    (WorkoutPlanService.getCurrentWeeklyPlan as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<WorkoutPlanScreen navigation={navigation} />);

    expect(screen.getByText('Loading workout plan...')).toBeTruthy();
  });

  it('shows error state and retries loading', async () => {
    (WorkoutPlanService.getCurrentWeeklyPlan as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(null);

    render(<WorkoutPlanScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Could not load workout plan')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Weekly Plan')).toBeTruthy();
    });
  });

  it('shows empty state for today and navigates to setup', async () => {
    (WorkoutPlanService.getCurrentWeeklyPlan as jest.Mock).mockResolvedValue(null);

    render(<WorkoutPlanScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('No exercises planned for today yet.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Set Up Today'));
    expect(navigation.navigate).toHaveBeenCalledWith('EditDayPlan', expect.any(Object));
  });
});
