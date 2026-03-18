import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NutritionService, Food } from '../../services/nutritionService';

export default function FoodSearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = searchQuery.trim();

      if (!query) {
        setFoods([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const results = await NutritionService.searchFoods(query);
        setFoods(results);
      } catch (error) {
        console.error('Food search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Foods</Text>
        <Text style={styles.pageSubtitle}>Search and add foods without using IDs.</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search food name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8D8E94"
        />

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#0E0E10" />
          </View>
        ) : (
          <FlatList
            data={foods}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.centerState}>
                <Text style={styles.emptyTitle}>
                  {hasSearched ? 'No matching foods' : 'Start typing to find foods'}
                </Text>
                <Text style={styles.emptyText}>
                  {hasSearched ? 'Try another keyword like chicken, rice, or yogurt.' : 'You can add a meal directly from results.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.foodCard}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  {item.brand ? <Text style={styles.foodBrand}>{item.brand}</Text> : null}
                  <Text style={styles.foodNutrition}>
                    {item.caloriesPer100g.toFixed(0)} kcal • P {item.proteinPer100g.toFixed(1)}g • C {item.carbsPer100g.toFixed(1)}g • F {item.fatPer100g.toFixed(1)}g
                  </Text>
                </View>

                <Pressable
                  style={styles.addButton}
                  onPress={() => navigation.navigate('LogNutrition', { selectedFood: item })}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
            )}
          />
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
  listContent: {
    paddingVertical: 14,
    paddingBottom: 22,
  },
  centerState: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    color: '#0E0E10',
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 15,
    color: '#8D8E94',
    textAlign: 'center',
    maxWidth: 280,
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
  foodInfo: {
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
  foodNutrition: {
    marginTop: 6,
    fontSize: 13,
    color: '#50525A',
    fontWeight: '500',
  },
  addButton: {
    minWidth: 72,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0E10',
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
