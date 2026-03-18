import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutPlanScreen from './WorkoutPlanScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('WorkoutPlanScreen states', () => {
  const navigation = {
    addListener: jest.fn((_event: string, cb: () => void) => {
      cb();
      return jest.fn();
    }),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while weekly plan is being loaded', () => {
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<WorkoutPlanScreen navigation={navigation} />);

    expect(screen.getByText('Loading workout plan...')).toBeTruthy();
  });

  it('shows error state and retries loading', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(null)
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
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    render(<WorkoutPlanScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('No exercises planned for today yet.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Set Up Today'));
    expect(navigation.navigate).toHaveBeenCalledWith('EditDayPlan', expect.any(Object));
  });
});
