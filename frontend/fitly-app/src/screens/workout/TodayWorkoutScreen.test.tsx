import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TodayWorkoutScreen from './TodayWorkoutScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('TodayWorkoutScreen states', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while plan is being loaded', () => {
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<TodayWorkoutScreen navigation={navigation} />);

    expect(screen.getByText("Loading today's workout...")).toBeTruthy();
  });

  it('shows error state and retries', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

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
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    render(<TodayWorkoutScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('No exercises planned for today yet.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Set Up Today'));
    expect(navigation.navigate).toHaveBeenCalledWith('EditDayPlan', expect.any(Object));
  });
});
