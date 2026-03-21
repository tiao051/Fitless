import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DailyNutritionScreen from './DailyNutritionScreen';
import { NutritionService } from '../../services/nutritionService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/nutritionService', () => ({
  NutritionService: {
    getDailySummary: jest.fn(),
  },
}));

describe('DailyNutritionScreen states', () => {
  let consoleErrorSpy: jest.SpyInstance;

  const navigation = {
    addListener: jest.fn(() => jest.fn()),
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

  it('shows loading state while daily summary is loading', () => {
    (NutritionService.getDailySummary as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<DailyNutritionScreen navigation={navigation} />);

    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('shows empty meals state when no meals are logged', async () => {
    (NutritionService.getDailySummary as jest.Mock).mockResolvedValue({
      date: new Date().toISOString().split('T')[0],
      meals: [],
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    });

    render(<DailyNutritionScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('No meals logged today yet.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Go to Today'));
    expect(navigation.navigate).toHaveBeenCalledWith('Home');
  });

  it('renders meals and total nutrition from API summary', async () => {
    (NutritionService.getDailySummary as jest.Mock).mockResolvedValue({
      date: new Date().toISOString().split('T')[0],
      meals: [
        {
          id: 10,
          userId: 1,
          food: { id: 1, name: 'Chicken Breast' },
          quantity: 200,
          meal: 'Lunch',
          logDate: new Date().toISOString(),
          nutrition: {
            calories: 330,
            protein: 62,
            carbs: 0,
            fat: 7,
          },
          createdAt: new Date().toISOString(),
        },
      ],
      totalNutrition: {
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
      },
    });

    render(<DailyNutritionScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Total intake')).toBeTruthy();
    });

    expect(screen.getAllByText('330 kcal').length).toBeGreaterThan(0);
    expect(screen.getByText('Protein 62.0g')).toBeTruthy();
    expect(screen.getByText('Chicken Breast')).toBeTruthy();
    expect(screen.getByText('Lunch • 200 g')).toBeTruthy();
  });
});
