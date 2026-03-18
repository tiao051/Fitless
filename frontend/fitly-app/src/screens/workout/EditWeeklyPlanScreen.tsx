import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

type PlannedExercise = {
  exerciseId: number;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
};

type DayPlan = {
  day: string;
  exercises: PlannedExercise[];
  isRestDay: boolean;
};

export default function EditWeeklyPlanScreen({ route, navigation }: any) {
  const { dayIndex } = route.params;
  const [currentPlan, setCurrentPlan] = useState<DayPlan | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [newSets, setNewSets] = useState('3');
  const [newReps, setNewReps] = useState('8');
  const [newWeight, setNewWeight] = useState('0');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load weekly plan
        const plan = await AsyncStorage.getItem('weeklyPlan');
        if (plan) {
          const weekPlan = JSON.parse(plan);
          setCurrentPlan(weekPlan[dayIndex]);
        } else {
          setCurrentPlan({
            day: days[dayIndex],
            exercises: [],
            isRestDay: false,
          });
        }

        // Load available exercises (mock data for now)
        // TODO: Replace with API call to backend
        setAvailableExercises(mockExercises);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load workout plan');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dayIndex]);

  const mockExercises: Exercise[] = [
    { id: 1, name: 'Bench Press', muscleGroup: 'Chest' },
    { id: 2, name: 'Dumbbell Press', muscleGroup: 'Chest' },
    { id: 3, name: 'Barbell Row', muscleGroup: 'Back' },
    { id: 4, name: 'Lat Pulldown', muscleGroup: 'Back' },
    { id: 5, name: 'Squat', muscleGroup: 'Legs' },
    { id: 6, name: 'Leg Press', muscleGroup: 'Legs' },
    { id: 7, name: 'Shoulder Press', muscleGroup: 'Shoulders' },
    { id: 8, name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  ];

  if (loading || !currentPlan) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#0E0E10" />
      </SafeAreaView>
    );
  }

  const addExerciseToPlan = () => {
    if (!selectedExercise) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }

    const newExercise: PlannedExercise = {
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      targetSets: parseInt(newSets, 10) || 3,
      targetReps: parseInt(newReps, 10) || 8,
      targetWeight: parseInt(newWeight, 10) || 0,
    };

    const updated = { ...currentPlan };
    updated.exercises.push(newExercise);
    setCurrentPlan(updated);

    // Reset form
    setSelectedExercise(null);
    setNewSets('3');
    setNewReps('8');
    setNewWeight('0');
    setShowAddExercise(false);
  };

  const removeExercise = (index: number) => {
    const updated = { ...currentPlan };
    updated.exercises.splice(index, 1);
    setCurrentPlan(updated);
  };

  const toggleRestDay = () => {
    const updated = { ...currentPlan };
    updated.isRestDay = !updated.isRestDay;
    if (updated.isRestDay) {
      updated.exercises = [];
    }
    setCurrentPlan(updated);
  };

  const savePlan = async () => {
    try {
      const plan = await AsyncStorage.getItem('weeklyPlan');
      const weekPlan = plan ? JSON.parse(plan) : [];
      weekPlan[dayIndex] = currentPlan;
      await AsyncStorage.setItem('weeklyPlan', JSON.stringify(weekPlan));

      Alert.alert('Success', 'Workout plan saved!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save plan');
    }
  };

  const muscleGroups = Array.from(new Set(availableExercises.map((e) => e.muscleGroup)));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.pageTitle}>{currentPlan.day}</Text>
        <Text style={styles.pageSubtitle}>Plan your workout</Text>

        {/* Rest Day Toggle */}
        <Pressable
          style={[styles.restDayToggle, currentPlan.isRestDay && styles.restDayToggleActive]}
          onPress={toggleRestDay}
        >
          <Text style={styles.restDayToggleText}>
            {currentPlan.isRestDay ? '😴 Rest Day' : 'Training Day'}
          </Text>
        </Pressable>

        {!currentPlan.isRestDay && (
          <>
            {/* Exercises List */}
            <View>
              <Text style={styles.sectionTitle}>Exercises</Text>

              {currentPlan.exercises.length > 0 ? (
                currentPlan.exercises.map((ex, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                      <Text style={styles.exerciseMeta}>
                        {ex.targetSets} x {ex.targetReps} @ {ex.targetWeight}kg
                      </Text>
                    </View>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeExercise(index)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No exercises added yet</Text>
              )}
            </View>

            {/* Add Exercise Button */}
            <Pressable
              style={styles.addButton}
              onPress={() => setShowAddExercise(true)}
            >
              <Text style={styles.addButtonText}>+ Add Exercise</Text>
            </Pressable>
          </>
        )}

        {/* Save Button */}
        <Pressable style={styles.saveButton} onPress={savePlan}>
          <Text style={styles.saveButtonText}>Save Plan</Text>
        </Pressable>
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal visible={showAddExercise} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Pressable onPress={() => setShowAddExercise(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Exercise Picker */}
              <Text style={styles.fieldLabel}>Exercise</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={selectedExercise?.id.toString() || ''}
                  onValueChange={(exerciseId) => {
                    const exercise = availableExercises.find((e) => e.id === parseInt(exerciseId, 10));
                    setSelectedExercise(exercise || null);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select an exercise" value="" />
                  {muscleGroups.map((group) => (
                    <Picker.Item key={group} label={`--- ${group} ---`} value="" enabled={false} />
                  ))}
                  {availableExercises.map((exercise) => (
                    <Picker.Item
                      key={exercise.id}
                      label={`  ${exercise.name}`}
                      value={exercise.id.toString()}
                    />
                  ))}
                </Picker>
              </View>

              {/* Sets */}
              <Text style={styles.fieldLabel}>Sets</Text>
              <TextInput
                style={styles.input}
                placeholder="3"
                keyboardType="number-pad"
                value={newSets}
                onChangeText={setNewSets}
              />

              {/* Reps */}
              <Text style={styles.fieldLabel}>Target Reps</Text>
              <TextInput
                style={styles.input}
                placeholder="8"
                keyboardType="number-pad"
                value={newReps}
                onChangeText={setNewReps}
              />

              {/* Weight */}
              <Text style={styles.fieldLabel}>Target Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="decimal-pad"
                value={newWeight}
                onChangeText={setNewWeight}
              />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowAddExercise(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalAddButton} onPress={addExerciseToPlan}>
                <Text style={styles.modalAddButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  backButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0E10',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: '#0E0E10',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#8D8E94',
    fontWeight: '500',
    marginBottom: 20,
  },
  restDayToggle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  restDayToggleActive: {
    backgroundColor: '#0E0E10',
    borderColor: '#0E0E10',
  },
  restDayToggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0E10',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E0E10',
    marginBottom: 12,
  },
  exerciseItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0E10',
  },
  exerciseMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#8D8E94',
    fontWeight: '500',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E43C3C',
  },
  emptyText: {
    fontSize: 14,
    color: '#8D8E94',
    fontWeight: '500',
    paddingVertical: 20,
  },
  addButton: {
    backgroundColor: '#F0F0F3',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0E10',
  },
  saveButton: {
    backgroundColor: '#0E0E10',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  /* Modal Styles */
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#F5F5F7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    marginTop: 80,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E0E10',
  },
  modalClose: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0E10',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E0E10',
    marginBottom: 8,
  },
  pickerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 150,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0E0E10',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0E10',
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#0E0E10',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
