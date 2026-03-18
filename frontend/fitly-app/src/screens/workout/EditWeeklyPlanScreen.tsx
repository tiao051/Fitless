import { useEffect, useState } from 'react';
import {
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
import { ExerciseService, Exercise as ExerciseApiItem } from '../../services/exerciseService';
import { WorkoutStateCard } from '../../components/workout/WorkoutStateCard';

type Exercise = ExerciseApiItem;

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
  dayType?: 'unset' | 'training' | 'rest' | 'cardio' | 'custom';
  planName?: string;
  customPlanLabel?: string;
};

export default function EditWeeklyPlanScreen({ route, navigation }: any) {
  const { dayIndex } = route.params;
  const [currentPlan, setCurrentPlan] = useState<DayPlan | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [exerciseCatalogStatus, setExerciseCatalogStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showDayTypeSelector, setShowDayTypeSelector] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [selectedBodySection, setSelectedBodySection] = useState('All');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [newSets, setNewSets] = useState('3');
  const [newReps, setNewReps] = useState('8');
  const [newWeight, setNewWeight] = useState('0');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const createEmptyWeekPlan = (): DayPlan[] =>
    days.map((day) => ({
      day,
      exercises: [],
      isRestDay: false,
      dayType: 'unset',
      planName: '',
      customPlanLabel: '',
    }));

  const normalizeWeekPlan = (raw: any): DayPlan[] => {
    const base = createEmptyWeekPlan();
    if (!Array.isArray(raw)) return base;

    return base.map((item, index) => {
      const existing = raw[index];
      if (!existing) return item;

      const inferredDayType =
        existing.dayType || (existing.isRestDay ? 'rest' : Array.isArray(existing.exercises) && existing.exercises.length > 0 ? 'training' : 'unset');

      return {
        ...item,
        ...existing,
        day: item.day,
        exercises: Array.isArray(existing.exercises) ? existing.exercises : [],
        dayType: inferredDayType,
        planName: existing.planName || '',
        customPlanLabel: existing.customPlanLabel || '',
      };
    });
  };

  const inferSuggestedGroup = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('chest') || lower.includes('push')) return 'Chest';
    if (lower.includes('back') || lower.includes('pull')) return 'Back';
    if (lower.includes('leg') || lower.includes('quad') || lower.includes('hamstring') || lower.includes('glute')) return 'Legs';
    if (lower.includes('shoulder') || lower.includes('delts')) return 'Shoulders';
    if (lower.includes('arm') || lower.includes('bicep') || lower.includes('tricep')) return 'Arms';
    if (lower.includes('upper')) return 'Upper';
    if (lower.includes('lower')) return 'Lower';
    if (lower.includes('core') || lower.includes('abs')) return 'Core';
    if (lower.includes('cardio') || lower.includes('run') || lower.includes('hiit')) return 'Cardio';
    return 'All';
  };

  const loadExerciseCatalog = async () => {
    setExerciseCatalogStatus('loading');

    try {
      const exercises = await ExerciseService.getAllExercises();
      setAvailableExercises(exercises);
      setExerciseCatalogStatus(exercises.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      console.error('Error loading exercise catalog:', error);
      setAvailableExercises([]);
      setExerciseCatalogStatus('error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const plan = await AsyncStorage.getItem('weeklyPlan');
      const normalized = normalizeWeekPlan(plan ? JSON.parse(plan) : []);
      setCurrentPlan(normalized[dayIndex] ?? createEmptyWeekPlan()[dayIndex]);

      await loadExerciseCatalog();
    } catch (error) {
      console.error('Error loading data:', error);
      setCurrentPlan(createEmptyWeekPlan()[dayIndex]);
      setLoadError('Unable to load this workout day. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dayIndex]);

  if (loading || !currentPlan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <WorkoutStateCard
            variant="loading"
            title="Loading workout day..."
            layout="full"
            testID="edit-workout-loading"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <WorkoutStateCard
            variant="error"
            title="Could not load workout day"
            description={loadError}
            actionLabel="Retry"
            onAction={loadData}
            layout="full"
            testID="edit-workout-error"
          />
        </View>
      </SafeAreaView>
    );
  }

  const addExerciseToPlan = () => {
    const customName = customExerciseName.trim();
    const selectedExercise = availableExercises.find((e) => e.id.toString() === selectedExerciseId);
    if (!selectedExercise && !customName) {
      Alert.alert('Error', 'Please choose an exercise or enter your own exercise name');
      return;
    }

    const newExercise: PlannedExercise = {
      exerciseId: selectedExercise?.id ?? -Date.now(),
      exerciseName: selectedExercise?.name ?? customName,
      targetSets: parseInt(newSets, 10) || 3,
      targetReps: parseInt(newReps, 10) || 8,
      targetWeight: parseInt(newWeight, 10) || 0,
    };

    const updated = { ...currentPlan };
    updated.exercises.push(newExercise);
    setCurrentPlan(updated);

    // Reset form
    setSelectedExerciseId('');
    setCustomExerciseName('');
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

  const setDayType = (dayType: 'training' | 'rest' | 'cardio' | 'custom') => {
    const updated = { ...currentPlan };
    updated.dayType = dayType;
    updated.isRestDay = dayType === 'rest';

    if (dayType === 'rest') {
      updated.exercises = [];
    }

    if (dayType !== 'custom') {
      updated.customPlanLabel = '';
    }

    if (dayType === 'rest') {
      updated.planName = '';
    }

    setCurrentPlan(updated);
    setShowDayTypeSelector(false);
  };

  const getDayTypeLabel = () => {
    if (!currentPlan.dayType || currentPlan.dayType === 'unset') {
      return 'Tap to choose day setup';
    }

    if (currentPlan.dayType === 'rest') return '😴 Rest Day';
    if (currentPlan.dayType === 'training') return '🏋️ Training Day';
    if (currentPlan.dayType === 'cardio') return '🏃 Cardio';

    if (currentPlan.customPlanLabel?.trim()) {
      return `🛠️ ${currentPlan.customPlanLabel.trim()}`;
    }

    return '🛠️ Plan it by your own';
  };

  const isSetupSelected = !!currentPlan.dayType && currentPlan.dayType !== 'unset';

  const openAddExerciseModal = () => {
    const suggestedGroup = inferSuggestedGroup(currentPlan.planName || currentPlan.customPlanLabel || '');
    setSelectedMuscleGroup(suggestedGroup);
    setSelectedBodySection('All');
    setSelectedEquipment('All');
    setSelectedExerciseId('');
    setCustomExerciseName('');
    setShowAddExercise(true);
  };

  const savePlan = async () => {
    try {
      const plan = await AsyncStorage.getItem('weeklyPlan');
      const weekPlan = normalizeWeekPlan(plan ? JSON.parse(plan) : []);
      weekPlan[dayIndex] = {
        ...currentPlan,
        isRestDay: currentPlan.dayType === 'rest',
      };
      await AsyncStorage.setItem('weeklyPlan', JSON.stringify(weekPlan));

      Alert.alert('Success', 'Workout plan saved!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save plan');
    }
  };

  const bodySections = ['All', ...Array.from(new Set(availableExercises.map((e) => e.bodySection)))];
  const muscleGroups = ['All', ...Array.from(new Set(availableExercises.map((e) => e.muscleGroup)))];
  const equipmentOptions = ['All', ...Array.from(new Set(availableExercises.map((e) => e.equipment)))];
  const hasExerciseCatalog = exerciseCatalogStatus === 'ready';

  const filteredExercises = availableExercises.filter((e) => {
    const bySection = selectedBodySection === 'All' || e.bodySection === selectedBodySection;
    const byMuscle = selectedMuscleGroup === 'All' || e.muscleGroup === selectedMuscleGroup;
    const byEquipment = selectedEquipment === 'All' || e.equipment === selectedEquipment;
    return bySection && byMuscle && byEquipment;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.pageTitle}>{currentPlan.day}</Text>
        <Text style={styles.pageSubtitle}>Plan your workout</Text>

        {/* Day Setup Selector */}
        <Text style={styles.setupLabel}>Day setup</Text>
        <Pressable
          style={[styles.daySetupSelector, isSetupSelected && styles.daySetupSelectorActive]}
          onPress={() => setShowDayTypeSelector(true)}
        >
          <Text style={[styles.daySetupText, isSetupSelected && styles.daySetupTextActive]}>
            {getDayTypeLabel()}
          </Text>
          <Text style={[styles.daySetupChevron, isSetupSelected && styles.daySetupTextActive]}>▾</Text>
        </Pressable>

        {currentPlan.dayType === 'custom' && (
          <View style={styles.customPlanSection}>
            <Text style={styles.fieldLabel}>Plan it by your own</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mobility + Breathwork"
              value={currentPlan.customPlanLabel || ''}
              onChangeText={(text) => setCurrentPlan({ ...currentPlan, customPlanLabel: text })}
            />
          </View>
        )}

        {!currentPlan.isRestDay && isSetupSelected && (
          <View style={styles.customPlanSection}>
            <Text style={styles.fieldLabel}>Day name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chest day"
              value={currentPlan.planName || ''}
              onChangeText={(text) => setCurrentPlan({ ...currentPlan, planName: text })}
            />
          </View>
        )}

        {!currentPlan.isRestDay && isSetupSelected && (
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
              onPress={openAddExerciseModal}
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

      <Modal visible={showDayTypeSelector} animationType="fade" transparent>
        <SafeAreaView style={styles.selectModalBackdrop}>
          <Pressable style={styles.selectModalOverlay} onPress={() => setShowDayTypeSelector(false)} />
          <View style={styles.selectModalCard}>
            <Text style={styles.selectModalTitle}>Choose day setup</Text>

            <Pressable style={styles.selectItem} onPress={() => setDayType('rest')}>
              <Text style={styles.selectItemText}>😴 Rest day</Text>
            </Pressable>
            <Pressable style={styles.selectItem} onPress={() => setDayType('training')}>
              <Text style={styles.selectItemText}>🏋️ Training day</Text>
            </Pressable>
            <Pressable style={styles.selectItem} onPress={() => setDayType('cardio')}>
              <Text style={styles.selectItemText}>🏃 Cardio</Text>
            </Pressable>
            <Pressable style={styles.selectItem} onPress={() => setDayType('custom')}>
              <Text style={styles.selectItemText}>🛠️ Plan it by your own</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

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
              {!hasExerciseCatalog && (
                <WorkoutStateCard
                  variant={exerciseCatalogStatus === 'error' ? 'error' : 'empty'}
                  title={
                    exerciseCatalogStatus === 'error'
                      ? 'Exercise library unavailable'
                      : 'No exercises available'
                  }
                  description={
                    exerciseCatalogStatus === 'error'
                      ? 'Cannot load exercises from API right now. You can still type your own exercise below.'
                      : 'Exercise catalog is currently empty. You can still type your own exercise below.'
                  }
                  actionLabel={exerciseCatalogStatus === 'error' ? 'Retry library load' : undefined}
                  onAction={exerciseCatalogStatus === 'error' ? loadExerciseCatalog : undefined}
                  testID="edit-workout-catalog-state"
                />
              )}

              {hasExerciseCatalog && (
                <>
              <Text style={styles.fieldLabel}>Body Section</Text>
              <Text style={styles.helperText}>Filter exercises by Upper / Lower / Core / Full Body.</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupChipsRow}
                style={styles.groupChipsScroller}
              >
                {bodySections.map((section) => {
                  const selected = selectedBodySection === section;
                  return (
                    <Pressable
                      key={section}
                      style={[styles.groupChip, selected && styles.groupChipActive]}
                      onPress={() => {
                        setSelectedBodySection(section);
                        setSelectedExerciseId('');
                      }}
                    >
                      <Text style={[styles.groupChipText, selected && styles.groupChipTextActive]}>{section}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Muscle Group</Text>
              <Text style={styles.helperText}>Use this to quickly filter suggested exercises.</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupChipsRow}
                style={styles.groupChipsScroller}
              >
                {muscleGroups.map((group) => {
                  const selected = selectedMuscleGroup === group;
                  return (
                    <Pressable
                      key={group}
                      style={[styles.groupChip, selected && styles.groupChipActive]}
                      onPress={() => {
                        setSelectedMuscleGroup(group);
                        setSelectedExerciseId('');
                      }}
                    >
                      <Text style={[styles.groupChipText, selected && styles.groupChipTextActive]}>{group}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Equipment</Text>
              <Text style={styles.helperText}>Optional filter if user wants machine-only, barbell-only, etc.</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupChipsRow}
                style={styles.groupChipsScroller}
              >
                {equipmentOptions.map((equipment) => {
                  const selected = selectedEquipment === equipment;
                  return (
                    <Pressable
                      key={equipment}
                      style={[styles.groupChip, selected && styles.groupChipActive]}
                      onPress={() => {
                        setSelectedEquipment(equipment);
                        setSelectedExerciseId('');
                      }}
                    >
                      <Text style={[styles.groupChipText, selected && styles.groupChipTextActive]}>{equipment}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Exercise</Text>
              <View style={styles.exerciseListBox}>
                {filteredExercises.length === 0 ? (
                  <Text style={styles.noExerciseText}>No exercises in this group.</Text>
                ) : (
                  filteredExercises.map((exercise) => {
                    const selected = selectedExerciseId === exercise.id.toString();
                    return (
                      <Pressable
                        key={exercise.id}
                        style={[styles.exerciseOption, selected && styles.exerciseOptionSelected]}
                        onPress={() => {
                          setSelectedExerciseId(exercise.id.toString());
                          setCustomExerciseName('');
                        }}
                      >
                        <Text style={[styles.exerciseOptionText, selected && styles.exerciseOptionTextSelected]}>
                          {exercise.name}
                        </Text>
                        <View style={styles.exerciseMetaWrap}>
                          <Text style={[styles.exerciseOptionGroup, selected && styles.exerciseOptionTextSelected]}>
                            {exercise.bodySection}
                          </Text>
                          <Text style={[styles.exerciseOptionGroup, selected && styles.exerciseOptionTextSelected]}>
                            {exercise.muscleGroup}
                          </Text>
                          <Text style={[styles.exerciseOptionGroup, selected && styles.exerciseOptionTextSelected]}>
                            {exercise.equipment}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
                </>
              )}

              <Text style={styles.fieldLabel}>Or add your own exercise</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Incline machine press"
                value={customExerciseName}
                onChangeText={(text) => {
                  setCustomExerciseName(text);
                  if (text.trim()) setSelectedExerciseId('');
                }}
              />

              {selectedMuscleGroup !== 'All' && (
                <Text style={styles.hintText}>
                  Suggested from your day name. You can switch group anytime.
                </Text>
              )}

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
    flex: 1,
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
  setupLabel: {
    fontSize: 13,
    color: '#8D8E94',
    fontWeight: '700',
    marginBottom: 8,
  },
  daySetupSelector: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: 24,
  },
  daySetupSelectorActive: {
    backgroundColor: '#0E0E10',
    borderColor: '#0E0E10',
  },
  daySetupText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0E10',
  },
  daySetupTextActive: {
    color: '#FFFFFF',
  },
  daySetupChevron: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8D8E94',
  },
  customPlanSection: {
    marginBottom: 20,
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
  selectModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  selectModalOverlay: {
    flex: 1,
  },
  selectModalCard: {
    backgroundColor: '#F5F5F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 2,
    borderColor: '#0E0E10',
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E0E10',
    marginBottom: 12,
  },
  selectItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  selectItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E0E10',
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
  helperText: {
    marginTop: -4,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#8D8E94',
  },
  hintText: {
    marginTop: -6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '500',
    color: '#8D8E94',
  },
  groupChipsScroller: {
    marginBottom: 14,
  },
  groupChipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  groupChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D9DAE0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupChipActive: {
    backgroundColor: '#0E0E10',
    borderColor: '#0E0E10',
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#54555C',
  },
  groupChipTextActive: {
    color: '#FFFFFF',
  },
  exerciseListBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    marginBottom: 14,
    padding: 8,
    maxHeight: 210,
  },
  noExerciseText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8D8E94',
    padding: 8,
  },
  exerciseOption: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E7EC',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseMetaWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  exerciseOptionSelected: {
    backgroundColor: '#0E0E10',
    borderColor: '#0E0E10',
  },
  exerciseOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E0E10',
  },
  exerciseOptionGroup: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8D8E94',
  },
  exerciseOptionTextSelected: {
    color: '#FFFFFF',
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
