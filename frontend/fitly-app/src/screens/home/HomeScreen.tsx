import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionService, DailyNutritionSummary } from '../../services/nutritionService';

export default function HomeScreen({ navigation }: any) {
  const [todaySummary, setTodaySummary] = useState<DailyNutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
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
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();
    return unsubscribe;
  }, [navigation]);

  const renderNutritionCard = (label: string, value: number, unit: string) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value.toFixed(1)}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const nutrition = todaySummary?.totalNutrition || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Summary</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.nutritionGrid}>
        {renderNutritionCard('Calories', nutrition.calories, 'kcal')}
        {renderNutritionCard('Protein', nutrition.protein, 'g')}
        {renderNutritionCard('Carbs', nutrition.carbs, 'g')}
        {renderNutritionCard('Fat', nutrition.fat, 'g')}
      </View>

      <View style={styles.mealsSection}>
        <Text style={styles.sectionTitle}>Meals Logged</Text>
        {todaySummary && todaySummary.meals && todaySummary.meals.length > 0 ? (
          todaySummary.meals.map((meal: any) => (
            <View key={meal.id} style={styles.mealItem}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.food.name}</Text>
                <Text style={styles.mealType}>{meal.meal}</Text>
              </View>
              <View style={styles.mealNutrition}>
                <Text style={styles.mealNutritionText}>
                  {meal.nutrition.calories.toFixed(0)} cal
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noMeals}>No meals logged yet</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('LogNutrition')}
      >
        <Text style={styles.primaryButtonText}>+ Log Meal</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('FoodSearch')}
      >
        <Text style={styles.secondaryButtonText}>Search Foods</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  cardLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  cardUnit: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  mealsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mealType: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  mealNutrition: {
    alignItems: 'flex-end',
  },
  mealNutritionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  noMeals: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});
