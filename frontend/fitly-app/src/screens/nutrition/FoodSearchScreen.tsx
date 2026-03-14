import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NutritionService, Food } from '../../services/nutritionService';

export default function FoodSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFoods([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const results = await NutritionService.searchFoods(query);
      setFoods(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search foods');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <View style={styles.foodItem}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        {item.brand && <Text style={styles.foodBrand}>{item.brand}</Text>}
        <View style={styles.servingInfo}>
          {item.servingText && (
            <Text style={styles.servingText}>{item.servingText}</Text>
          )}
          <Text style={styles.calPerServing}>
            {item.caloriesPer100g.toFixed(0)} cal/100g
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.logButton}
        onPress={() => {
          Alert.alert('Log this food?', `${item.name} - ${item.caloriesPer100g.toFixed(0)} cal/100g`, [
            { text: 'Cancel', onPress: () => {} },
            {
              text: 'Log',
              onPress: () => {
                // Will implement logging in next screen
                Alert.alert('Food selected', `You selected ${item.name}`);
              },
            },
          ]);
        }}
      >
        <Text style={styles.logButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Foods</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by food name..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>

      {loading ? (
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : searched && foods.length === 0 ? (
        <View style={[styles.center, { flex: 1 }]}>
          <Text style={styles.emptyText}>No foods found</Text>
          <Text style={styles.emptySubtext}>Try different search terms</Text>
        </View>
      ) : (
        <FlatList
          data={foods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}

      {!searched && foods.length === 0 && (
        <View style={[styles.center, { flex: 1 }]}>
          <Text style={styles.placeholder}>Search for a food to get started</Text>
        </View>
      )}
    </View>
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
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  foodItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  foodBrand: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  servingInfo: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  servingText: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  calPerServing: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  logButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '400',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
