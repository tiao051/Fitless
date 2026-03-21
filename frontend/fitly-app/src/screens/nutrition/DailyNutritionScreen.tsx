import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyNutritionSummary, NutritionService } from '../../services/nutritionService';

export default function DailyNutritionScreen({ navigation }: any) {
  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setSummary(null);
        return;
      }

      const date = new Date().toISOString().split('T')[0];
      const daily = await NutritionService.getDailySummary(parseInt(userIdStr, 10), date);
      setSummary(daily);
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status !== 401) {
        console.error('Error loading daily nutrition summary:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      loadSummary();
    });

    loadSummary();
    return unsubscribe;
  }, [loadSummary, navigation]);

  const nutrition = summary?.totalNutrition || {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSummary();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.subtitle}>Detailed nutrition breakdown for today.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total intake</Text>
          <Text style={styles.cardText}>{nutrition.calories.toFixed(0)} kcal</Text>
          <Text style={styles.cardText}>Protein {nutrition.protein.toFixed(1)}g</Text>
          <Text style={styles.cardText}>Carbs {nutrition.carbs.toFixed(1)}g</Text>
          <Text style={styles.cardText}>Fat {nutrition.fat.toFixed(1)}g</Text>
        </View>

        <Text style={styles.sectionTitle}>Meals</Text>
        {summary?.meals?.length ? (
          summary.meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.food.name}</Text>
                <Text style={styles.mealMeta}>{meal.meal} • {meal.quantity} g</Text>
              </View>
              <Text style={styles.mealCalories}>{meal.nutrition.calories.toFixed(0)} kcal</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No meals logged today yet.</Text>
        )}

        <Pressable style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Go to Today</Text>
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    color: '#0E0E10',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 24,
    color: '#8D8E94',
    fontWeight: '500',
  },
  card: {
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardTitle: {
    fontSize: 20,
    color: '#0E0E10',
    fontWeight: '800',
  },
  cardText: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#4F515A',
    fontWeight: '500',
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 22,
    color: '#0E0E10',
    fontWeight: '800',
  },
  mealCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
    marginRight: 8,
  },
  mealName: {
    fontSize: 16,
    color: '#0E0E10',
    fontWeight: '700',
  },
  mealMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#8D8E94',
    fontWeight: '500',
  },
  mealCalories: {
    fontSize: 14,
    color: '#0E0E10',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#8D8E94',
    fontWeight: '500',
    marginBottom: 6,
  },
  button: {
    marginTop: 14,
    minHeight: 60,
    borderRadius: 30,
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
});
