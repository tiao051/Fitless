import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionService, DailyNutritionSummary } from '../../services/nutritionService';
import { DayPlanResponse, WorkoutPlanService } from '../../services/workoutPlanService';
import { ChibiPlaceholder } from '../../components/domain/ChibiPlaceholder';

export default function HomeScreen({ navigation }: any) {
  const [todaySummary, setTodaySummary] = useState<DailyNutritionSummary | null>(null);
  const [weekPlan, setWeekPlan] = useState<DayPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const userIdStr = await AsyncStorage.getItem('userId');
      if (userIdStr) {
        const summary = await NutritionService.getDailySummary(parseInt(userIdStr, 10), today);
        setTodaySummary(summary);
      }
      const weeklyPlan = await WorkoutPlanService.getCurrentWeeklyPlan();
      setWeekPlan(weeklyPlan?.dayPlans || []);
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status !== 401) {
        console.error('Error loading home data:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      loadData();
    });
    return unsubscribe;
  }, [loadData, navigation]);

  const nutrition = todaySummary?.totalNutrition || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const calorieTarget = 2200;
  const proteinTarget = 190;
  const carbsTarget = 280;
  const fatTarget = 70;

  const getTodayIndex = () => {
    const today = new Date().getDay();
    return (today + 6) % 7;
  };

  const getTodayPlan = () => weekPlan.find((plan) => plan.dayOfWeek === getTodayIndex());

  const weekDays = useMemo(
    () => [
      { index: 0, label: 'MON' },
      { index: 1, label: 'TUE' },
      { index: 2, label: 'WED' },
      { index: 3, label: 'THU' },
      { index: 4, label: 'FRI' },
      { index: 5, label: 'SAT' },
      { index: 6, label: 'SUN' },
    ],
    []
  );

  const getStreakCount = () => {
    let count = 0;
    const today = getTodayIndex();
    for (let i = 0; i < 7; i++) {
      const idx = (today - i + 7) % 7;
      const plan = weekPlan.find((p) => p.dayOfWeek === idx);
      if (plan && !plan.isRestDay && (plan.plannedExercises?.length || 0) > 0) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getHour = () => {
    const h = new Date().getHours();
    const h12 = h % 12 || 12;
    const period = h >= 12 ? 'pm' : 'am';
    return `${h12} ${period}`;
  };

  const hasTrackedToday = nutrition.calories > 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#0E0E10" />
      </SafeAreaView>
    );
  }

  const todayPlan = getTodayPlan();
  const streakCount = getStreakCount();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getTimeGreeting()}
            </Text>
            <Text style={styles.subGreeting}>
              {getDayOfWeek()} · {getHour()}
            </Text>
          </View>
          {streakCount > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streakCount}</Text>
            </View>
          )}
        </View>

        {/* Chibi Placeholder */}
        <ChibiPlaceholder showLabel={true} />

        {/* Nudge — only show if nothing tracked yet */}
        {!hasTrackedToday && (
          <View style={styles.nudgeCard}>
            <View style={styles.nudgeContent}>
              <Text style={styles.nudgeTitle}>
                Time to fuel up
              </Text>
              <Text style={styles.nudgeSub}>
                Add your first meal of the day
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('LogNutrition')}
              style={styles.nudgeAction}
            >
              <Text style={styles.nudgeActionText}>→</Text>
            </Pressable>
          </View>
        )}

        {/* Nutrition Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Nutrition</Text>
            <Pressable onPress={() => navigation.navigate('NutritionSummary')}>
              <Text style={styles.cardAction}>Details →</Text>
            </Pressable>
          </View>

          <View style={styles.calorieSection}>
            <Text style={styles.calorieValue}>
              {Math.round(nutrition.calories)}
              <Text style={styles.calorieTarget}>/{calorieTarget}</Text>
            </Text>
            <Text style={styles.calorieLabel}>kcal</Text>
          </View>

          <View style={styles.macroList}>
            {[
              { label: 'Protein', value: nutrition.protein, target: proteinTarget },
              { label: 'Carbs', value: nutrition.carbs, target: carbsTarget },
              { label: 'Fat', value: nutrition.fat, target: fatTarget },
            ].map((macro) => (
              <View key={macro.label} style={styles.macroRow}>
                <View style={styles.macroInfo}>
                  <Text style={styles.macroName}>{macro.label}</Text>
                  <Text style={styles.macroVal}>
                    {Math.round(macro.value)}/{macro.target}g
                  </Text>
                </View>
                <View style={styles.macroBarBg}>
                  <View
                    style={[
                      styles.macroBarFill,
                      { width: `${Math.min((macro.value / macro.target) * 100, 100)}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('LogNutrition')}
          >
            <Text style={styles.primaryBtnText}>Add Meal</Text>
          </Pressable>
        </View>

        {/* Workout Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Workout</Text>
            <Pressable onPress={() => navigation.navigate('WorkoutPlan')}>
              <Text style={styles.cardAction}>Plan →</Text>
            </Pressable>
          </View>

          <View style={styles.workoutContent}>
            <View style={styles.workoutText}>
              <Text style={styles.workoutTitle}>
                {todayPlan && !todayPlan.isRestDay && (todayPlan.plannedExercises?.length || 0) > 0
                  ? `${todayPlan.plannedExercises?.length} exercises`
                  : todayPlan?.isRestDay
                  ? 'Rest day'
                  : 'No plan set'}
              </Text>
              <Text style={styles.workoutSub}>
                {todayPlan && !todayPlan.isRestDay && (todayPlan.plannedExercises?.length || 0) > 0
                  ? 'Ready to go'
                  : todayPlan?.isRestDay
                  ? 'Recover well'
                  : 'Create a plan'}
              </Text>
            </View>
            <View
              style={[
                styles.workoutStatus,
                todayPlan && !todayPlan.isRestDay && (todayPlan.plannedExercises?.length || 0) > 0
                  ? styles.workoutStatusActive
                  : styles.workoutStatusInactive,
              ]}
            >
              <Text style={styles.workoutStatusIcon}>
                {todayPlan && !todayPlan.isRestDay && (todayPlan.plannedExercises?.length || 0) > 0
                  ? '⚡'
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* This Week */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Week</Text>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day) => {
              const plan = weekPlan.find((p) => p.dayOfWeek === day.index);
              const isCompleted =
                plan && !plan.isRestDay && (plan.plannedExercises?.length || 0) > 0;
              const isToday = day.index === getTodayIndex();

              return (
                <Pressable
                  key={day.label}
                  style={styles.dayCol}
                  onPress={() => navigation.navigate('WorkoutPlan')}
                >
                  <View
                    style={[
                      styles.dayBubble,
                      isCompleted && styles.dayBubbleDone,
                      isToday && !isCompleted && styles.dayBubbleToday,
                    ]}
                  >
                    {isCompleted && <Text style={styles.dayCheckmark}>✓</Text>}
                    {!isCompleted && isToday && <View style={styles.todayDot} />}
                  </View>
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                    {day.label[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  greeting: {
    fontSize: 36,
    fontWeight: '300',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 14,
    color: '#9B9B99',
    marginTop: 6,
    fontWeight: '400',
  },
  streakBadge: {
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 2,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Nudge
  nudgeCard: {
    backgroundColor: '#F5F5F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nudgeContent: {
    flex: 1,
  },
  nudgeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  nudgeSub: {
    fontSize: 13,
    color: '#9B9B99',
    marginTop: 4,
  },
  nudgeAction: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  nudgeActionText: {
    fontSize: 16,
    color: '#FAFAF8',
    fontWeight: '600',
  },

  // Shared Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E6',
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.4,
  },
  cardAction: {
    fontSize: 13,
    color: '#9B9B99',
    fontWeight: '500',
  },

  // Calories/Nutrition
  calorieSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  calorieValue: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -1,
  },
  calorieTarget: {
    fontSize: 16,
    fontWeight: '400',
    color: '#BEBEBE',
    marginLeft: 4,
  },
  calorieLabel: {
    fontSize: 13,
    color: '#9B9B99',
    fontWeight: '500',
    marginLeft: 8,
  },

  // Macro bars
  macroList: {
    gap: 14,
    marginBottom: 18,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroInfo: {
    width: 70,
  },
  macroName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  macroVal: {
    fontSize: 12,
    color: '#9B9B99',
    marginTop: 3,
    fontWeight: '400',
  },
  macroBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0EE',
    borderRadius: 3,
  },
  macroBarFill: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
  },

  // Primary Button
  primaryBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Workout
  workoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  workoutText: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  workoutSub: {
    fontSize: 13,
    color: '#9B9B99',
    marginTop: 4,
    fontWeight: '400',
  },
  workoutStatus: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  workoutStatusActive: {
    backgroundColor: '#F5F5F3',
    borderColor: '#E8E8E6',
  },
  workoutStatusInactive: {
    backgroundColor: '#FAFAF8',
    borderColor: '#E8E8E6',
  },
  workoutStatusIcon: {
    fontSize: 24,
  },

  // Week
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayBubble: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleDone: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  dayBubbleToday: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  dayCheckmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1A1A1A',
  },
  dayName: {
    fontSize: 12,
    color: '#BEBEBE',
    fontWeight: '500',
  },
  dayNameToday: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
});