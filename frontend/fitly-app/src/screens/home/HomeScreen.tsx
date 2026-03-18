import { useCallback, useEffect, useState } from 'react';
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

export default function HomeScreen({ navigation }: any) {
  const [todaySummary, setTodaySummary] = useState<DailyNutritionSummary | null>(null);
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
    } catch (error) {
      const status = (error as any)?.response?.status;
      // 401 is handled globally by apiClient interceptor.
      if (status !== 401) {
        console.error('Error loading daily summary:', error);
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#0E0E10" />
      </SafeAreaView>
    );
  }

  const hasMeals = todaySummary?.meals && todaySummary.meals.length > 0;
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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subGreeting}>Let's track your health today</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <Pressable
            style={[styles.quickActionButton, styles.primaryAction]}
            onPress={() => navigation.navigate('LogNutrition')}
          >
            <Text style={styles.quickActionIcon}>🍽️</Text>
            <Text style={[styles.quickActionText, styles.primaryActionText]}>Track your calories</Text>
          </Pressable>

          <Pressable
            style={[styles.quickActionButton, styles.secondaryAction]}
            onPress={() => navigation.navigate('FoodSearch')}
          >
            <Text style={styles.quickActionIcon}>🔍</Text>
            <Text style={[styles.quickActionText, { color: '#0E0E10' }]}>Browse</Text>
          </Pressable>
        </View>

        {/* Today's Status */}
        {hasMeals && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Today's Log</Text>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>{todaySummary.meals.length} meal{todaySummary.meals.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <View style={styles.statusMetrics}>
              <View style={styles.statusMetricItem}>
                <Text style={styles.statusMetricLabel}>Calories</Text>
                <Text style={styles.statusMetricValue}>{nutrition.calories.toFixed(0)}</Text>
              </View>
              <View style={styles.statusMetricItem}>
                <Text style={styles.statusMetricLabel}>Protein</Text>
                <Text style={styles.statusMetricValue}>{nutrition.protein.toFixed(0)}g</Text>
              </View>
              <View style={styles.statusMetricItem}>
                <Text style={styles.statusMetricLabel}>Carbs</Text>
                <Text style={styles.statusMetricValue}>{nutrition.carbs.toFixed(0)}g</Text>
              </View>
              <View style={styles.statusMetricItem}>
                <Text style={styles.statusMetricLabel}>Fat</Text>
                <Text style={styles.statusMetricValue}>{nutrition.fat.toFixed(0)}g</Text>
              </View>
            </View>
          </View>
        )}

        {/* Meals List */}
        {hasMeals && (
          <View>
            <Text style={styles.mealsTitle}>Meals</Text>
            {todaySummary.meals.map((meal) => (
              <View key={meal.id} style={styles.mealCard}>
                <View>
                  <Text style={styles.mealName}>{meal.food.name}</Text>
                  <Text style={styles.mealMeta}>{meal.meal} • {meal.quantity} g</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.nutrition.calories.toFixed(0)} kcal</Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!hasMeals && (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateTitle}>No meals logged yet</Text>
            <Text style={styles.emptyStateText}>Start by logging your first meal to begin tracking!</Text>
          </View>
        )}
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
  },
  /* Hero Section */
  heroSection: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: '#0E0E10',
    letterSpacing: -0.8,
  },
  subGreeting: {
    marginTop: 6,
    fontSize: 16,
    color: '#8D8E94',
    fontWeight: '500',
  },
  /* Quick Actions */
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#0E0E10',
    borderColor: '#0E0E10',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#101012',
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryActionText: {
    color: '#FFFFFF',
  },
  /* Status Card - shown when meals logged */
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#101012',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E0E10',
  },
  statusTag: {
    backgroundColor: '#F0F0F3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8D8E94',
  },
  statusMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusMetricLabel: {
    fontSize: 12,
    color: '#8D8E94',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E0E10',
  },
  /* Meals Section */
  mealsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E0E10',
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#101012',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealName: {
    fontSize: 18,
    color: '#0E0E10',
    fontWeight: '700',
    maxWidth: 240,
  },
  mealMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#8D8E94',
    fontWeight: '500',
  },
  mealCalories: {
    fontSize: 16,
    color: '#0E0E10',
    fontWeight: '700',
  },
  /* Empty State */
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#101012',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E0E10',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8D8E94',
    fontWeight: '500',
    textAlign: 'center',
  },
  /* Legacy - kept for compatibility */
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#101012',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: '#8D8E94',
    fontWeight: '700',
  },
  metricValue: {
    marginTop: 8,
    fontSize: 30,
    lineHeight: 34,
    color: '#0E0E10',
    fontWeight: '900',
  },
  metricUnit: {
    marginTop: 2,
    fontSize: 13,
    color: '#8D8E94',
    fontWeight: '600',
  },
});
