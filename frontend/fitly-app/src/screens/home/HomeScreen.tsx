import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
      // 401 is handled globally by apiClient interceptor.
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

    loadData();

    return unsubscribe;
  }, [loadData, navigation]);

  const nutrition = todaySummary?.totalNutrition || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const calorieTarget = 2200;
  const proteinTarget = 160;
  const carbsTarget = 280;
  const fatTarget = 70;

  const getTodayIndex = () => {
    const today = new Date().getDay();
    return (today + 6) % 7;
  };

  const getTodayPlan = () => weekPlan.find((plan) => plan.dayOfWeek === getTodayIndex());

  const getDayTitle = (dayPlan: DayPlanResponse | undefined) => {
    if (!dayPlan) return 'No plan yet';
    if (dayPlan.isRestDay) return 'Recovery Day';
    if (dayPlan.planName?.trim()) return dayPlan.planName;
    if (dayPlan.customPlanLabel?.trim()) return dayPlan.customPlanLabel;
    if (dayPlan.dayType === 'cardio') return 'Cardio Session';
    if (dayPlan.dayType === 'training') return 'Strength Session';
    if ((dayPlan.plannedExercises?.length || 0) > 0) return 'Training Session';
    return 'No plan yet';
  };

  const getDaySubtitle = (dayPlan: DayPlanResponse | undefined) => {
    if (!dayPlan) return 'Set up your day plan';
    if (dayPlan.isRestDay) return 'Rest and recover';

    const count = dayPlan.plannedExercises?.length || 0;
    if (count === 0) return 'No exercises added';

    const estimateMins = Math.max(20, count * 15);
    return `${count} exercises (Est. ${estimateMins} min)`;
  };

  const getPlanIcon = (dayPlan: DayPlanResponse | undefined) => {
    if (!dayPlan) return '•';
    if (dayPlan.isRestDay || dayPlan.dayType === 'rest') return '😴';

    const source = `${dayPlan.planName || ''} ${dayPlan.customPlanLabel || ''}`.toLowerCase();
    if (dayPlan.dayType === 'cardio' || source.includes('cardio') || source.includes('run')) return '🏃';
    if (source.includes('chest') || source.includes('push')) return '🫀';
    if (source.includes('back') || source.includes('pull')) return '🦍';
    if (source.includes('leg') || source.includes('lower')) return '🦵';
    if (source.includes('upper')) return '🏋️';
    if (source.includes('core') || source.includes('abs')) return '⚡';
    if ((dayPlan.plannedExercises?.length || 0) > 0 || dayPlan.dayType === 'training' || dayPlan.dayType === 'custom') return '🏋️';
    return '•';
  };

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

  const todayPlan = getTodayPlan();
  const todayPlanTitle = getDayTitle(todayPlan);
  const todayPlanSubtitle = getDaySubtitle(todayPlan);
  const todayProgress = Math.min(100, Math.round(((todayPlan?.plannedExercises?.length || 0) > 0 ? 0 : 0)));
  const caloriesPercent = Math.min(100, Math.round((nutrition.calories / calorieTarget) * 100));

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#0E0E10" />
      </SafeAreaView>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          loadData();
        }} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.heroSection}>
            <Text style={styles.greeting}>Hi, Athlete!</Text>
            <Text style={styles.subGreeting}>{getGreeting()}! Let's conquer today.</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.iconButtonText}>👤</Text>
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => Alert.alert('Notifications', 'Notification center will be available soon.')}
            >
              <Text style={styles.iconButtonText}>🔔</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Today's Workout</Text>
            <Pressable onPress={() => navigation.navigate('WorkoutPlan')}>
              <Text style={styles.cardHeaderLink}>View Plan</Text>
            </Pressable>
          </View>

          <View style={styles.focusSummaryRow}>
            <View style={styles.focusSummaryLeft}>
              <Text style={styles.focusTitle}>{todayPlanTitle}</Text>
              <Text style={styles.focusSubtitle}>{todayPlanSubtitle}</Text>
            </View>
            <View style={styles.progressRing}>
              <Text style={styles.progressText}>{todayProgress}%</Text>
              <Text style={styles.progressCaption}>COMPLETE</Text>
            </View>
          </View>

          <Pressable
            style={styles.primaryCtaButton}
            onPress={() => navigation.navigate('TodayWorkout')}
          >
            <Text style={styles.primaryCtaText}>START TODAY'S WORKOUT</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Weekly Snapshot</Text>
            <Pressable onPress={() => navigation.navigate('WorkoutPlan')}>
              <Text style={styles.cardHeaderLink}>View Full Week</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day) => {
              const plan = weekPlan.find((item) => item.dayOfWeek === day.index);
              const isToday = day.index === getTodayIndex();
              const isSet = !!plan && (plan.isRestDay || (plan.plannedExercises?.length || 0) > 0 || !!plan.dayType);

              return (
                <View
                  key={day.label}
                  style={[
                    styles.weekDayCard,
                    isSet ? styles.weekDayCardPlanned : styles.weekDayCardEmpty,
                    isToday && styles.weekDayCardToday,
                  ]}
                >
                  <Text style={styles.weekDayLabel}>{day.label}</Text>
                  <Text style={styles.weekDayIcon}>{getPlanIcon(plan)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Nutrition Summary</Text>
            <Pressable onPress={() => navigation.navigate('DailyNutrition')}>
              <Text style={styles.cardHeaderLink}>View Daily Summary</Text>
            </Pressable>
          </View>

          <View style={styles.nutritionTopRow}>
            <View style={styles.calorieCircleWrap}>
              <View style={styles.calorieCircle}>
                <Text style={styles.calorieMainText}>{Math.round(nutrition.calories)}/{calorieTarget}</Text>
                <Text style={styles.calorieSubText}>kcal</Text>
              </View>
              <View style={styles.caloriePercentBadge}>
                <Text style={styles.caloriePercentText}>{caloriesPercent}%</Text>
              </View>
            </View>
            <View style={styles.macrosList}>
              <Text style={styles.macroText}>P: {nutrition.protein.toFixed(0)}/{proteinTarget}g</Text>
              <Text style={styles.macroText}>C: {nutrition.carbs.toFixed(0)}/{carbsTarget}g</Text>
              <Text style={styles.macroText}>F: {nutrition.fat.toFixed(0)}/{fatTarget}g</Text>
            </View>
          </View>

          <View style={styles.nutritionActionsRow}>
            <Pressable
              style={[styles.quickActionButton, styles.primaryAction]}
              onPress={() => navigation.navigate('LogNutrition')}
            >
              <Text style={[styles.quickActionText, styles.primaryActionText]}>QUICK ADD MEAL</Text>
            </Pressable>

            <Pressable
              style={[styles.quickActionButton, styles.secondaryAction]}
              onPress={() => navigation.navigate('FoodSearch')}
            >
              <Text style={[styles.quickActionText, { color: '#0E0E10' }]}>Food Search</Text>
            </Pressable>
          </View>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  heroSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0E0E10',
    letterSpacing: -0.4,
  },
  subGreeting: {
    marginTop: 6,
    fontSize: 15,
    color: '#8D8E94',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#101012',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 17,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#101012',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E0E10',
  },
  cardHeaderLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E0E10',
    textDecorationLine: 'underline',
  },
  focusSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  focusSummaryLeft: {
    flex: 1,
    paddingRight: 10,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E0E10',
  },
  focusSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#8D8E94',
  },
  progressRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: '#101012',
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0E0E10',
  },
  progressCaption: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: '700',
    color: '#8D8E94',
  },
  primaryCtaButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0E0E10',
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  weekDayCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  weekDayCardPlanned: {
    backgroundColor: '#F0F0F3',
    borderColor: '#101012',
  },
  weekDayCardEmpty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6D7DC',
  },
  weekDayCardToday: {
    backgroundColor: '#DFF0E8',
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E0E10',
  },
  weekDayIcon: {
    marginTop: 5,
    fontSize: 18,
  },
  nutritionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calorieCircleWrap: {
    position: 'relative',
  },
  calorieCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#101012',
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E0E10',
  },
  calorieSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8D8E94',
  },
  caloriePercentBadge: {
    position: 'absolute',
    bottom: -6,
    right: -8,
    minWidth: 38,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#101012',
    backgroundColor: '#EAF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  caloriePercentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E0E10',
  },
  macrosList: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  macroText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E0E10',
  },
  nutritionActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryAction: {
    backgroundColor: '#0E0E10',
    borderColor: '#0E0E10',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#101012',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
  },
});
