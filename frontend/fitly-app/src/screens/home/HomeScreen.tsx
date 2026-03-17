import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
      console.error('Error loading daily summary:', error);
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

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#0E0E10" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          loadData();
        }} />}
      >
        <Text style={styles.pageTitle}>Today</Text>
        <Text style={styles.pageSubtitle}>{dateLabel}</Text>

        <View style={styles.metricsGrid}>
          <MetricCard label="Calories" value={nutrition.calories.toFixed(0)} unit="kcal" />
          <MetricCard label="Protein" value={nutrition.protein.toFixed(1)} unit="g" />
          <MetricCard label="Carbs" value={nutrition.carbs.toFixed(1)} unit="g" />
          <MetricCard label="Fat" value={nutrition.fat.toFixed(1)} unit="g" />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Meals</Text>
          <Pressable onPress={() => navigation.navigate('LogNutrition')}>
            <Text style={styles.sectionLink}>Add</Text>
          </Pressable>
        </View>

        {todaySummary?.meals?.length ? (
          todaySummary.meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View>
                <Text style={styles.mealName}>{meal.food.name}</Text>
                <Text style={styles.mealMeta}>{meal.meal} • {meal.quantity} g</Text>
              </View>
              <Text style={styles.mealCalories}>{meal.nutrition.calories.toFixed(0)} kcal</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No meals logged yet</Text>
            <Text style={styles.emptyText}>Tap Add to log your first meal for today.</Text>
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('LogNutrition')}>
          <Text style={styles.primaryButtonText}>Add meal</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('FoodSearch')}>
          <Text style={styles.secondaryButtonText}>Browse foods</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
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
  pageTitle: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    color: '#0E0E10',
    letterSpacing: -1,
  },
  pageSubtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 17,
    color: '#8D8E94',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
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
  sectionHeaderRow: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 26,
    lineHeight: 30,
    color: '#0E0E10',
    fontWeight: '800',
  },
  sectionLink: {
    fontSize: 18,
    color: '#0E0E10',
    textDecorationLine: 'underline',
    fontWeight: '600',
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#101012',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#0E0E10',
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 15,
    color: '#8D8E94',
  },
  primaryButton: {
    marginTop: 12,
    minHeight: 60,
    borderRadius: 30,
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  secondaryButton: {
    marginTop: 10,
    minHeight: 58,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#101012',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0E0E10',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
  },
});
