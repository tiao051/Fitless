import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutStateCard } from '../../components/workout/WorkoutStateCard';
import { DayPlanResponse, WorkoutPlanService } from '../../services/workoutPlanService';

type DayPlan = {
  day: string;
  exercises: Array<{
    plannedExerciseId?: number;
    exerciseId: number;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
    targetWeight: number;
  }>;
  isRestDay: boolean;
  dayType?: 'unset' | 'training' | 'rest' | 'cardio' | 'custom';
  planName?: string;
  customPlanLabel?: string;
};

export default function WorkoutPlanScreen({ navigation }: any) {
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const createEmptyWeekPlan = (): DayPlan[] =>
    days.map((day) => ({
      day,
      exercises: [],
      isRestDay: false,
      dayType: 'unset',
      planName: '',
      customPlanLabel: '',
    }));

  const normalizeWeekPlan = (raw: DayPlanResponse[] | null | undefined): DayPlan[] => {
    const base = createEmptyWeekPlan();
    if (!Array.isArray(raw)) return base;

    return base.map((item) => {
      const existing = raw.find((day) => day.dayOfWeek === days.indexOf(item.day));
      if (!existing) return item;

      const exercises = Array.isArray(existing.plannedExercises)
        ? existing.plannedExercises
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((exercise) => ({
              plannedExerciseId: exercise.plannedExerciseId,
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              targetSets: exercise.targetSets,
              targetReps: exercise.targetReps,
              targetWeight: Number(exercise.targetWeight) || 0,
            }))
        : [];

      return {
        ...item,
        day: item.day,
        exercises,
        isRestDay: existing.isRestDay,
        dayType: existing.dayType || (existing.isRestDay ? 'rest' : exercises.length > 0 ? 'training' : 'unset'),
        planName: existing.planName || '',
        customPlanLabel: existing.customPlanLabel || '',
      };
    });
  };

  const loadWeekPlan = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const currentPlan = await WorkoutPlanService.getCurrentWeeklyPlan();
      setWeekPlan(normalizeWeekPlan(currentPlan?.dayPlans));
    } catch (error) {
      console.error('Error loading week plan:', error);
      setWeekPlan(createEmptyWeekPlan());
      setLoadError('Unable to load weekly workout plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize weekly plan from AsyncStorage
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadWeekPlan();
    });

    loadWeekPlan();

    return unsubscribe;
  }, [navigation]);

  const getTodayIndex = () => {
    const today = new Date().getDay();
    return (today + 6) % 7; // Convert Sunday=0 to Monday=0
  };

  const getPlanIcon = (dayPlan: DayPlan): string => {
    const source = `${dayPlan.planName || ''} ${dayPlan.customPlanLabel || ''}`.toLowerCase();

    if (dayPlan.isRestDay || dayPlan.dayType === 'rest') return '😴';
    if (dayPlan.dayType === 'cardio' || source.includes('cardio') || source.includes('run')) return '🏃';
    if (source.includes('chest') || source.includes('push')) return '🫀';
    if (source.includes('back') || source.includes('pull')) return '🦍';
    if (source.includes('leg') || source.includes('lower')) return '🦵';
    if (source.includes('upper')) return '🏋️';
    if (source.includes('core') || source.includes('abs')) return '⚡';
    if ((dayPlan.exercises?.length || 0) > 0 || dayPlan.dayType === 'training' || dayPlan.dayType === 'custom') return '🏋️';

    return '•';
  };

  const today = days[getTodayIndex()];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <WorkoutStateCard
            variant="loading"
            title="Loading workout plan..."
            layout="full"
            testID="workout-plan-loading"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <WorkoutStateCard
            variant="error"
            title="Could not load workout plan"
            description={loadError}
            actionLabel="Retry"
            onAction={loadWeekPlan}
            layout="full"
            testID="workout-plan-error"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Weekly Plan</Text>
        <Text style={styles.pageSubtitle}>Plan your workouts for the week</Text>

        {/* Weekly Calendar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
          style={styles.weekScroller}
        >
          {weekPlan.map((dayPlan, index) => {
            const isToday = dayPlan.day === today;
            const exerciseCount = dayPlan.exercises.length;
            const hasSetup = !!dayPlan.dayType && dayPlan.dayType !== 'unset';
            const hasPlanName = !!dayPlan.planName?.trim() || !!dayPlan.customPlanLabel?.trim();
            const isPlanned = dayPlan.isRestDay || exerciseCount > 0 || hasSetup || hasPlanName;
            const planIcon = getPlanIcon(dayPlan);
            const shortLabel =
              dayPlan.planName?.trim() ||
              dayPlan.customPlanLabel?.trim() ||
              (dayPlan.dayType === 'cardio' ? 'Cardio' : dayPlan.dayType === 'training' ? 'Training' : '');

            return (
              <Pressable
                key={dayPlan.day}
                style={[
                  styles.dayCard,
                  isPlanned ? styles.dayCardPlanned : styles.dayCardUnplanned,
                  isToday && styles.dayCardToday,
                ]}
                onPress={() => navigation.navigate('EditDayPlan', { dayIndex: index })}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isPlanned ? styles.dayLabelPlanned : styles.dayLabelUnplanned,
                  ]}
                  numberOfLines={1}
                >
                  {dayPlan.day.slice(0, 3)}
                </Text>

                <Text
                  style={[
                    styles.dayIcon,
                    isPlanned ? styles.dayIconPlanned : styles.dayIconUnplanned,
                  ]}
                  numberOfLines={1}
                >
                  {planIcon}
                </Text>

                {!dayPlan.isRestDay && shortLabel ? (
                  <Text
                    style={[
                      styles.dayStatus,
                      isPlanned ? styles.dayStatusPlanned : styles.dayStatusUnplanned,
                    ]}
                    numberOfLines={1}
                  >
                    {shortLabel}
                  </Text>
                ) : !dayPlan.isRestDay && exerciseCount > 0 ? (
                  <Text
                    style={[
                      styles.dayStatus,
                      isPlanned ? styles.dayStatusPlanned : styles.dayStatusUnplanned,
                    ]}
                    numberOfLines={1}
                  >
                    {`${exerciseCount} ex`}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Today's Workout Quick View */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>

          {weekPlan[getTodayIndex()]?.isRestDay ? (
            <View style={styles.restDayCard}>
              <Text style={styles.restDayEmoji}>😴</Text>
              <Text style={styles.restDayText}>Rest Day - Recover well!</Text>
            </View>
          ) : weekPlan[getTodayIndex()]?.exercises.length ? (
            <View>
              {weekPlan[getTodayIndex()].exercises.map((ex, idx) => (
                <View key={idx} style={styles.exercisePreview}>
                  <View>
                    <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                    <Text style={styles.exerciseMeta}>
                      {ex.targetSets} sets x {ex.targetReps} reps @ {ex.targetWeight}kg
                    </Text>
                  </View>
                  <Text style={styles.exerciseStatus}>0/0</Text>
                </View>
              ))}

              <Pressable
                style={styles.startButton}
                onPress={() => navigation.navigate('TodayWorkout')}
              >
                <Text style={styles.startButtonText}>Start Workout</Text>
              </Pressable>
            </View>
          ) : (
            <WorkoutStateCard
              variant="empty"
              title="No exercises planned for today yet."
              actionLabel="Set Up Today"
              onAction={() => navigation.navigate('EditDayPlan', { dayIndex: getTodayIndex() })}
              testID="workout-plan-empty"
            />
          )}
        </View>

        {/* Edit Plan Button */}
        <Pressable
          style={styles.editButton}
          onPress={() => navigation.navigate('EditDayPlan', { dayIndex: getTodayIndex() })}
        >
          <Text style={styles.editButtonText}>Edit Full Plan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: '#0E0E10',
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 16,
    color: '#8D8E94',
    fontWeight: '500',
  },
  /* Week Row */
  weekScroller: {
    marginBottom: 28,
    marginHorizontal: -2,
  },
  weekRow: {
    paddingHorizontal: 2,
    gap: 10,
  },
  dayCard: {
    width: 94,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardPlanned: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0E0E10',
  },
  dayCardUnplanned: {
    backgroundColor: '#EEEFF3',
    borderColor: '#D5D6DC',
  },
  dayCardToday: {
    borderColor: '#0E0E10',
    borderWidth: 2,
    shadowColor: '#0E0E10',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  dayLabelPlanned: {
    color: '#0E0E10',
  },
  dayLabelUnplanned: {
    color: '#6D6E74',
  },
  dayStatus: {
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 76,
    textAlign: 'center',
  },
  dayStatusPlanned: {
    color: '#4E4F56',
  },
  dayStatusUnplanned: {
    color: '#8A8B92',
  },
  dayIcon: {
    fontSize: 14,
    marginBottom: 3,
  },
  dayIconPlanned: {
    color: '#0E0E10',
  },
  dayIconUnplanned: {
    color: '#8A8B92',
  },
  /* Today Section */
  todaySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E0E10',
    marginBottom: 12,
  },
  restDayCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 18,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8D8E94',
  },
  exercisePreview: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0E10',
  },
  exerciseMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#8D8E94',
    fontWeight: '500',
  },
  exerciseStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E0E10',
  },
  startButton: {
    marginTop: 14,
    backgroundColor: '#0E0E10',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0E0E10',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#0E0E10',
    fontSize: 16,
    fontWeight: '700',
  },
});
