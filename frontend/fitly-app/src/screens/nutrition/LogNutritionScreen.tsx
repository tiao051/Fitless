import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionService } from '../../services/nutritionService';
import { Picker } from '@react-native-picker/picker';

export default function LogNutritionScreen({ navigation }: any) {
  const [foodId, setFoodId] = useState('1');
  const [quantity, setQuantity] = useState('100');
  const [meal, setMeal] = useState('Breakfast');
  const [loading, setLoading] = useState(false);

  const handleLogNutrition = async () => {
    if (!foodId || !quantity || !meal) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Quantity must be a valid number greater than 0');
      return;
    }

    setLoading(true);
    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const userId = parseInt(userIdStr, 10);
      const logDate = new Date().toISOString();

      await NutritionService.logNutrition(
        userId,
        parseInt(foodId, 10),
        qty,
        meal,
        logDate
      );

      Alert.alert('Success', `Logged ${meal} successfully!`);
      setFoodId('1');
      setQuantity('100');
      setMeal('Breakfast');
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log nutrition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Food</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Food ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter food ID"
            value={foodId}
            onChangeText={setFoodId}
            keyboardType="number-pad"
            editable={!loading}
          />
          <Text style={styles.hint}>Use 1 for Mackerel, 2 for Scallops, etc.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Quantity (grams)</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={meal}
              onValueChange={setMeal}
              enabled={!loading}
              style={styles.picker}
            >
              <Picker.Item label="Breakfast" value="Breakfast" />
              <Picker.Item label="Lunch" value="Lunch" />
              <Picker.Item label="Dinner" value="Dinner" />
              <Picker.Item label="Snack" value="Snack" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logButton, loading && styles.disabled]}
          onPress={handleLogNutrition}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logButtonText}>Log Food</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>How to use:</Text>
        <Text style={styles.infoText}>1. Enter the Food ID (check API or food list)</Text>
        <Text style={styles.infoText}>2. Enter quantity in grams</Text>
        <Text style={styles.infoText}>3. Select meal type</Text>
        <Text style={styles.infoText}>4. Tap "Log Food"</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  form: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  logButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  info: {
    backgroundColor: '#FFF3F3',
    marginHorizontal: 12,
    marginBottom: 20,
    marginTop: 12,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginVertical: 3,
  },
});
