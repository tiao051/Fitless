import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionService, Food } from '../../services/nutritionService';

const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function LogNutritionScreen({ navigation, route }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(route.params?.selectedFood ?? null);
  const [quantity, setQuantity] = useState('100');
  const [meal, setMeal] = useState('Breakfast');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (route.params?.selectedFood) {
      setSelectedFood(route.params.selectedFood);
      setStatusMessage('Food selected. Set quantity and meal type to save.');
    }
  }, [route.params?.selectedFood]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const search = query.trim();
      if (!search || selectedFood) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const foods = await NutritionService.searchFoods(search);
        setResults(foods);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, selectedFood]);

  const quantityNumber = Number(quantity);
  const isValidQuantity = Number.isFinite(quantityNumber) && quantityNumber > 0;

  const preview = useMemo(() => {
    if (!selectedFood || !isValidQuantity) {
      return null;
    }

    const ratio = quantityNumber / 100;
    return {
      calories: selectedFood.caloriesPer100g * ratio,
      protein: selectedFood.proteinPer100g * ratio,
      carbs: selectedFood.carbsPer100g * ratio,
      fat: selectedFood.fatPer100g * ratio,
    };
  }, [selectedFood, quantityNumber, isValidQuantity]);

  const handleSave = async () => {
    if (!selectedFood || !isValidQuantity) {
      setStatusMessage('Please select a food and enter a valid quantity.');
      return;
    }

    setSaving(true);
    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setStatusMessage('User session not found. Please sign in again.');
        return;
      }

      await NutritionService.logNutrition(
        parseInt(userIdStr, 10),
        selectedFood.id,
        quantityNumber,
        meal,
        new Date().toISOString()
      );

      setStatusMessage('Meal logged successfully.');
      setQuery('');
      setResults([]);
      setSelectedFood(null);
      setQuantity('100');
      setMeal('Breakfast');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Log nutrition failed:', error);
      setStatusMessage('Could not save meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Add Meal</Text>
        <Text style={styles.pageSubtitle}>Choose a food, set quantity, and save.</Text>

        {!selectedFood ? (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Search food name"
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#8D8E94"
            />

            {searching ? (
              <View style={styles.centerState}>
                <ActivityIndicator color="#0E0E10" />
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.resultsContainer}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  query.trim() ? (
                    <Text style={styles.emptyText}>No foods found. Try another keyword.</Text>
                  ) : (
                    <Text style={styles.emptyText}>Type food name to begin.</Text>
                  )
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.foodCard}
                    onPress={() => {
                      setSelectedFood(item);
                      setStatusMessage('Food selected. Set quantity and meal type to save.');
                    }}
                  >
                    <View style={styles.foodTextWrap}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      {item.brand ? <Text style={styles.foodBrand}>{item.brand}</Text> : null}
                    </View>
                    <Text style={styles.foodCalories}>{item.caloriesPer100g.toFixed(0)} kcal</Text>
                  </Pressable>
                )}
              />
            )}
          </>
        ) : (
          <View style={styles.editorWrap}>
            <View style={styles.selectedFoodCard}>
              <Text style={styles.selectedFoodTitle}>{selectedFood.name}</Text>
              {selectedFood.brand ? <Text style={styles.selectedFoodBrand}>{selectedFood.brand}</Text> : null}
              <Pressable onPress={() => setSelectedFood(null)}>
                <Text style={styles.changeFoodLink}>Change food</Text>
              </Pressable>
            </View>

            <View style={styles.formBlock}>
              <Text style={styles.formLabel}>Quantity (grams)</Text>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#8D8E94"
              />
            </View>

            <View style={styles.formBlock}>
              <Text style={styles.formLabel}>Meal type</Text>
              <View style={styles.mealRow}>
                {meals.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.mealChip, meal === item && styles.mealChipActive]}
                    onPress={() => setMeal(item)}
                  >
                    <Text style={[styles.mealChipText, meal === item && styles.mealChipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {preview ? (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Nutrition preview</Text>
                <Text style={styles.previewLine}>{preview.calories.toFixed(0)} kcal</Text>
                <Text style={styles.previewLine}>
                  Protein {preview.protein.toFixed(1)}g • Carbs {preview.carbs.toFixed(1)}g • Fat {preview.fat.toFixed(1)}g
                </Text>
              </View>
            ) : null}

            {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

            <Pressable
              style={[styles.saveButton, (!isValidQuantity || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValidQuantity || saving}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save meal</Text>}
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
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
  searchInput: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 18,
    color: '#0E0E10',
    fontWeight: '500',
  },
  centerState: {
    marginTop: 18,
    alignItems: 'center',
  },
  resultsContainer: {
    marginTop: 12,
    paddingBottom: 24,
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#8D8E94',
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  foodTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  foodName: {
    fontSize: 18,
    color: '#0E0E10',
    fontWeight: '700',
  },
  foodBrand: {
    marginTop: 2,
    fontSize: 13,
    color: '#8D8E94',
    fontWeight: '600',
  },
  foodCalories: {
    fontSize: 15,
    color: '#0E0E10',
    fontWeight: '700',
  },
  editorWrap: {
    paddingBottom: 20,
  },
  selectedFoodCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  selectedFoodTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E0E10',
  },
  selectedFoodBrand: {
    marginTop: 2,
    fontSize: 14,
    color: '#8D8E94',
    fontWeight: '600',
  },
  changeFoodLink: {
    marginTop: 8,
    fontSize: 15,
    color: '#0E0E10',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  formBlock: {
    marginTop: 8,
  },
  formLabel: {
    fontSize: 16,
    color: '#0E0E10',
    fontWeight: '700',
    marginBottom: 8,
  },
  quantityInput: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 18,
    color: '#0E0E10',
    fontWeight: '600',
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealChip: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mealChipActive: {
    backgroundColor: '#0E0E10',
  },
  mealChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E0E10',
  },
  mealChipTextActive: {
    color: '#FFFFFF',
  },
  previewCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#111',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewTitle: {
    fontSize: 16,
    color: '#0E0E10',
    fontWeight: '800',
    marginBottom: 4,
  },
  previewLine: {
    fontSize: 15,
    color: '#4F515A',
    fontWeight: '600',
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4F515A',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 14,
    minHeight: 60,
    borderRadius: 30,
    backgroundColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A9A9B0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
});
