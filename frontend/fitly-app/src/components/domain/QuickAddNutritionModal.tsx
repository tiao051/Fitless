import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionService } from '../../services/nutritionService';

interface QuickAddNutritionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface SelectedFood {
  id: number;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSize: number;
}

export function QuickAddNutritionModal({
  visible,
  onClose,
  onSuccess,
}: QuickAddNutritionModalProps) {
  const [step, setStep] = useState(1); // 1 or 2
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [selectedTime] = useState(new Date());
  const [expandBreakdown, setExpandBreakdown] = useState(false);
  const [quantity, setQuantity] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await NutritionService.searchFoods(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Calculate current nutrition based on quantity
  const calculateNutrition = () => {
    if (!selectedFood || !quantity) {
      return {
        calories: Math.round(selectedFood?.caloriesPer100g || 0),
        protein: (selectedFood?.proteinPer100g || 0).toFixed(1),
        carbs: (selectedFood?.carbsPer100g || 0).toFixed(1),
        fat: (selectedFood?.fatPer100g || 0).toFixed(1),
      };
    }

    const gram = parseFloat(quantity) || selectedFood.servingSize;
    const multiplier = gram / 100;

    return {
      calories: Math.round(selectedFood.caloriesPer100g * multiplier),
      protein: (selectedFood.proteinPer100g * multiplier).toFixed(1),
      carbs: (selectedFood.carbsPer100g * multiplier).toFixed(1),
      fat: (selectedFood.fatPer100g * multiplier).toFixed(1),
    };
  };

  const nutrition = calculateNutrition();

  // Search foods
  const performSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Select food and move to step 2
  const handleSelectFood = (food: any) => {
    setSelectedFood({
      id: food.id,
      name: food.name,
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g,
      servingSize: food.servingSize || 100,
    });
    setSearchResults([]);
    setSearchQuery('');
    setQuantity('');
    setStep(2);
  };

  // Save and confirm
  const handleSave = async () => {
    if (!selectedFood) return;

    try {
      const logDate = new Date().toISOString(); // Full ISO datetime instead of just date
      const gram = parseFloat(quantity) || selectedFood.servingSize;
      const userIdStr = await AsyncStorage.getItem('userId');
      
      if (!userIdStr) {
        console.error('User ID not found');
        return;
      }

      const userId = parseInt(userIdStr, 10);
      const mealType = 'breakfast'; // TODO: Allow user to select meal type

      await NutritionService.logNutrition(userId, selectedFood.id, gram, mealType, logDate);

      onSuccess?.(`Added ${selectedFood.name} - ${nutrition.calories} kcal`);
      resetModal();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSearchQuery('');
    setSelectedFood(null);
    setQuantity('');
    setExpandBreakdown(false);
    onClose();
  };

  const handleClose = () => {
    resetModal();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Add Meal</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? (
            // Step 1: Search Food + Time
            <View>
              <Text style={styles.stepTitle}>What did you eat?</Text>

              {/* Search Input */}
              <TextInput
                style={styles.searchInput}
                placeholder="Search food..."
                placeholderTextColor="#BEBEBE"
                value={searchQuery}
                onChangeText={performSearch}
              />

              {/* Search Results */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1A1A1A" />
                </View>
              )}

              {searchResults.length > 0 && (
                <View style={styles.resultsContainer}>
                  {searchResults.map((food) => (
                    <Pressable
                      key={food.id}
                      style={styles.foodItem}
                      onPress={() => handleSelectFood(food)}
                    >
                      <View>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <Text style={styles.foodMeta}>
                          {Math.round(food.caloriesPer100g)} kcal / 100g
                        </Text>
                      </View>
                      <Text style={styles.foodArrow}>→</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {searchQuery && searchResults.length === 0 && !loading && (
                <Text style={styles.noResults}>No foods found</Text>
              )}

              {/* Time Picker Section */}
              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>Time of meal:</Text>
                <Text style={styles.timeDisplay}>
                  {selectedTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
                <Text style={styles.timePlaceholder}>
                  (Time picker component to be implemented)
                </Text>
              </View>

              {/* Next Button */}
              <Pressable
                style={[
                  styles.primaryBtn,
                  !selectedFood && styles.primaryBtnDisabled,
                ]}
                onPress={() => setStep(2)}
                disabled={!selectedFood}
              >
                <Text style={styles.primaryBtnText}>Next</Text>
              </Pressable>
            </View>
          ) : (
            // Step 2: Confirm Nutrition
            <View>
              <Text style={styles.stepTitle}>{selectedFood?.name}</Text>

              {/* Calories Display */}
              <View style={styles.caloriesCard}>
                <Text style={styles.caloriesValue}>{nutrition.calories}</Text>
                <Text style={styles.caloriesLabel}>kcal</Text>
              </View>

              {/* Macro Summary */}
              <View style={styles.macroSummary}>
                {[
                  { label: 'Protein', value: nutrition.protein },
                  { label: 'Carbs', value: nutrition.carbs },
                  { label: 'Fat', value: nutrition.fat },
                ].map((macro) => (
                  <View key={macro.label} style={styles.macroTile}>
                    <Text style={styles.macroLabel}>{macro.label}</Text>
                    <Text style={styles.macroValue}>{macro.value}g</Text>
                  </View>
                ))}
              </View>

              {/* Expandable Breakdown Section */}
              <Pressable
                style={styles.breakdownToggle}
                onPress={() => setExpandBreakdown(!expandBreakdown)}
              >
                <Text style={styles.breakdownToggleText}>
                  Provide details {expandBreakdown ? '−' : '+'}
                </Text>
              </Pressable>

              {expandBreakdown && (
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownHint}>
                    Enter amount in grams to calculate exact macro intake
                  </Text>

                  <View style={styles.quantityInput}>
                    <TextInput
                      style={styles.quantityField}
                      placeholder="Enter grams"
                      placeholderTextColor="#BEBEBE"
                      keyboardType="decimal-pad"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                    <Text style={styles.quantityUnit}>g</Text>
                  </View>

                  <Text style={styles.breakdownPlaceholder}>
                    (Component breakdown to be implemented)
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonGroup}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </Pressable>

                <Pressable style={styles.primaryBtn} onPress={handleSave}>
                  <Text style={styles.primaryBtnText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E6',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeBtn: {
    fontSize: 20,
    color: '#9B9B99',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  resultsContainer: {
    marginTop: 12,
    gap: 8,
  },
  foodItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  foodMeta: {
    fontSize: 12,
    color: '#9B9B99',
    marginTop: 4,
  },
  foodArrow: {
    fontSize: 14,
    color: '#BEBEBE',
  },
  noResults: {
    fontSize: 14,
    color: '#9B9B99',
    textAlign: 'center',
    marginTop: 20,
  },
  timeSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  timeLabel: {
    fontSize: 12,
    color: '#9B9B99',
    fontWeight: '600',
  },
  timeDisplay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 6,
  },
  timePlaceholder: {
    fontSize: 12,
    color: '#BEBEBE',
    fontStyle: 'italic',
    marginTop: 8,
  },
  caloriesCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#9B9B99',
    marginTop: 4,
  },
  macroSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  macroTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#9B9B99',
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 6,
  },
  breakdownToggle: {
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  breakdownToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  breakdownSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  breakdownHint: {
    fontSize: 12,
    color: '#9B9B99',
  },
  quantityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityField: {
    flex: 1,
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  quantityUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  breakdownPlaceholder: {
    fontSize: 12,
    color: '#BEBEBE',
    fontStyle: 'italic',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: '#E8E8E6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});
