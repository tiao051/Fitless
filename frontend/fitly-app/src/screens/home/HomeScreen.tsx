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
            <Text style={styles.greeting}>Hi, Athlete</Text>
            <Text style={styles.dayGreeting}>
              {getDayOfWeek()} · {getTimeGreeting()}
            </Text>
          </View>
          {streakCount > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>{streakCount} day streak</Text>
            </View>
          )}
        </View>

        {/* Nudge — only show if nothing tracked yet */}
        {!hasTrackedToday && (
          <View style={styles.nudgeCard}>
            <View style={styles.nudgeAccent} />
            <View style={styles.nudgeContent}>
              <Text style={styles.nudgeTitle}>
                It's {getHour()} — nothing tracked yet
              </Text>
              <Text style={styles.nudgeSub}>
                Don't forget to add your meals today
              </Text>
            </View>
          </View>
        )}

        {/* Calories Today */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Calories today</Text>
            <Pressable onPress={() => navigation.navigate('NutritionSummary')}>
              <Text style={styles.cardLink}>View summary</Text>
            </Pressable>
          </View>

          <Text style={styles.calorieValue}>
            {Math.round(nutrition.calories)}
            <Text style={styles.calorieOf}>  / {calorieTarget} kcal</Text>
          </Text>

          {!hasTrackedToday && (
            <Text style={styles.calorieHint}>Start adding meals to track your progress</Text>
          )}

          <View style={styles.macroList}>
            {[
              { label: 'Protein', value: nutrition.protein, target: proteinTarget },
              { label: 'Carbs', value: nutrition.carbs, target: carbsTarget },
              { label: 'Fat', value: nutrition.fat, target: fatTarget },
            ].map((macro) => (
              <View key={macro.label} style={styles.macroRow}>
                <Text style={styles.macroName}>{macro.label}</Text>
                <View style={styles.macroBarBg}>
                  <View
                    style={[
                      styles.macroBarFill,
                      { width: `${Math.min((macro.value / macro.target) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.macroVal}>
                  {Math.round(macro.value)}/{macro.target}g
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.addMealBtn}
            onPress={() => navigation.navigate('LogNutrition')}
          >
            <Text style={styles.addMealText}>Add a meal</Text>
          </Pressable>
        </View>

        {/* Today's Workout */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Today's workout</Text>
            <Pressable onPress={() => navigation.navigate('WorkoutPlan')}>
              <Text style={styles.cardLink}>View plan</Text>
            </Pressable>
          </View>

          <View style={styles.workoutRow}>
            <View style={styles.workoutLeft}>
              <Text style={styles.workoutTitle}>
                {todayPlan && !todayPlan.isRestDay && (todayPlan.plannedExercises?.length || 0) > 0
                  ? todayPlan.plannedExercises?.length + ' exercises planned'
                  : 'Rest day? Or set a plan.'}
              </Text>
              <Text style={styles.workoutSub}>
                {todayPlan && !todayPlan.isRestDay && (todayPlan.plannedExercises?.length || 0) > 0
                  ? 'Tap to start your session'
                  : 'No workout scheduled yet'}
              </Text>
            </View>
            <Pressable
              style={styles.setPlanBtn}
              onPress={() => navigation.navigate('WorkoutPlan')}
            >
              <Text style={styles.setPlanText}>+ Set plan</Text>
            </Pressable>
          </View>
        </View>

        {/* This Week */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>This week</Text>
            {streakCount > 0 && (
              <Text style={styles.streakIndicator}>{streakCount} in a row</Text>
            )}
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day) => {
              const plan = weekPlan.find((p) => p.dayOfWeek === day.index);
              const isCompleted =
                plan && !plan.isRestDay && (plan.plannedExercises?.length || 0) > 0;
              const isToday = day.index === getTodayIndex();

              return (
                <View key={day.label} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dayBubble,
                      isCompleted && styles.dayBubbleDone,
                      isToday && !isCompleted && styles.dayBubbleToday,
                    ]}
                  >
                    {isCompleted && (
                      <Text style={styles.dayCheckmark}>✓</Text>
                    )}
                    {!isCompleted && isToday && (
                      <View style={styles.todayDot} />
                    )}
                  </View>
                  <Text style={styles.dayName}>{day.label[0]}</Text>
                </View>
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
    backgroundColor: '#F6F6F4',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 10,
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
    fontSize: 32,
    fontWeight: '500',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  dayGreeting: {
    fontSize: 16,
    color: '#BBB',
    marginTop: 3,
  },
  streakBadge: {
    backgroundColor: '#FF4500',
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 20,
    marginTop: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },

  // Nudge
  nudgeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#EBEBEB',
    borderLeftWidth: 2,
    borderLeftColor: '#FF4500',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  nudgeAccent: {
    width: 0,
  },
  nudgeContent: {
    padding: 14,
  },
  nudgeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  nudgeSub: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 3,
  },

  // Shared card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#EBEBEB',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 16,
    color: '#BBB',
  },
  cardLink: {
    fontSize: 14,
    color: '#BBB',
  },

  // Calories
  calorieValue: {
    fontSize: 42,
    fontWeight: '500',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  calorieOf: {
    fontSize: 17,
    fontWeight: '400',
    color: '#CCC',
  },
  calorieHint: {
    fontSize: 14,
    color: '#BBB',
    marginBottom: 14,
  },

  // Macro bars
  macroList: {
    gap: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroName: {
    fontSize: 14,
    color: '#BBB',
    width: 46,
  },
  macroBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#F0F0EE',
    borderRadius: 2,
  },
  macroBarFill: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
  },
  macroVal: {
    fontSize: 14,
    color: '#CCC',
    width: 52,
    textAlign: 'right',
  },

  // Add meal button
  addMealBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addMealText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    letterSpacing: 0.02,
  },

  // Workout
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutLeft: {
    flex: 1,
    marginRight: 12,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  workoutSub: {
    fontSize: 16,
    color: '#CCC',
    marginTop: 3,
  },
  setPlanBtn: {
    backgroundColor: '#F6F6F4',
    borderWidth: 0.5,
    borderColor: '#E0E0DC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  setPlanText: {
    fontSize: 14,
    color: '#888',
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
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#F6F6F4',
    borderWidth: 0.5,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleDone: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  dayBubbleToday: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
  },
  dayCheckmark: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A1A1A',
  },
  dayName: {
    fontSize: 12,
    color: '#CCC',
  },
  streakIndicator: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF4500',
  },
});