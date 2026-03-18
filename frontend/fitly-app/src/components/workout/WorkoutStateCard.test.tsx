import { render, screen, fireEvent } from '@testing-library/react-native';
import { WorkoutStateCard } from './WorkoutStateCard';

describe('WorkoutStateCard', () => {
  it('shows loading spinner and title', () => {
    render(
      <WorkoutStateCard
        variant="loading"
        title="Loading workout plan..."
        testID="state-card"
      />
    );

    expect(screen.getByText('Loading workout plan...')).toBeTruthy();
    expect(screen.getByTestId('state-card-spinner')).toBeTruthy();
  });

  it('shows retry action and calls handler', () => {
    const onAction = jest.fn();

    render(
      <WorkoutStateCard
        variant="error"
        title="Could not load"
        description="Please retry"
        actionLabel="Retry"
        onAction={onAction}
      />
    );

    fireEvent.press(screen.getByText('Retry'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
