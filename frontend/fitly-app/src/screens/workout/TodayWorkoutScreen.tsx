import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutStateCard } from '../../components/workout/WorkoutStateCard';
import { WorkoutPlanService } from '../../services/workoutPlanService';
import { WorkoutService } from '../../services/workoutService';

type PlannedExercise = {
  plannedExerciseId?: number;
  exerciseId: number;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
};

type CompletedSet = {
  setNumber: number;
  reps: number;
  weight: number;
};

type ExerciseLog = {
  plannedExerciseId?: number;
  exerciseId: number;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  completedSets: CompletedSet[];
};

export default function TodayWorkoutScreen({ navigation }: any) {
  const WORKOUT_NAME = 'Today Plan Log';
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const getUserId = async (): Promise<number | null> => {
    const userId = await AsyncStorage.getItem('userId');
    const parsed = Number(userId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const loadTodayPlan = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const todayPlan = await WorkoutPlanService.getTodayPlan();

      const logs: ExerciseLog[] = (todayPlan.plannedExercises || []).map((ex: PlannedExercise) => ({
        plannedExerciseId: ex.plannedExerciseId,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetWeight: Number(ex.targetWeight) || 0,
        completedSets: [],
      }));

      const userId = await getUserId();
      if (!userId) {
        throw new Error('Missing authenticated user context');
      }

      const { startDate, endDate } = getTodayRange();
      const todayWorkouts = await WorkoutService.getUserWorkoutsByDateRange(userId, startDate, endDate);
      const existingWorkout = todayWorkouts.find((workout) => workout.name === WORKOUT_NAME);

      if (existingWorkout) {
        const hydratedLogs = logs.map((exercise) => {
          const matchingSets = existingWorkout.sets
            .filter((set) => set.exercise.id === exercise.exerciseId)
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set) => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: Number(set.weight) || 0,
            }));

          return {
            ...exercise,
            completedSets: matchingSets,
          };
        });

        setExercises(hydratedLogs);
        setNotes(existingWorkout.notes || '');
        setIsWorkoutCompleted(true);
      } else {
        setExercises(logs);
        setNotes('');
        setIsWorkoutCompleted(false);
      }
    } catch (error) {
      console.error('Error loading today plan:', error);
      setExercises([]);
      setLoadError('Unable to load today\'s workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayPlan();
  }, []);

  const getTodayIndex = () => {
    const today = new Date().getDay();
    return (today + 6) % 7;
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const nextSetNumber = updated[exerciseIndex].completedSets.length + 1;
    
    updated[exerciseIndex].completedSets.push({
      setNumber: nextSetNumber,
      reps: updated[exerciseIndex].targetReps,
      weight: updated[exerciseIndex].targetWeight,
    });
    
    setExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
    const updated = [...exercises];
    const numValue = parseInt(value, 10) || 0;
    
    if (field === 'reps') {
      updated[exerciseIndex].completedSets[setIndex].reps = numValue;
    } else {
      updated[exerciseIndex].completedSets[setIndex].weight = numValue;
    }
    
    setExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].completedSets.splice(setIndex, 1);
    setExercises(updated);
  };

  const getExerciseStatus = (exercise: ExerciseLog) => {
    if (exercise.completedSets.length === 0) {
      return `0/${exercise.targetSets}`;
    }
    
    const completedTarget = exercise.completedSets.filter(
      (s) => s.reps >= exercise.targetReps && s.weight >= exercise.targetWeight
    ).length;
    
    return `${completedTarget}/${exercise.targetSets}`;
  };

  const getStatusColor = (exercise: ExerciseLog) => {
    if (exercise.completedSets.length === 0) return '#8D8E94';
    
    const allCompleted = exercise.completedSets.every(
      (s) => s.reps >= exercise.targetReps && s.weight >= exercise.targetWeight
    );
    
    return allCompleted ? '#0E8B2A' : '#F39C12';
  };

  const saveWorkoutProgress = async (completedOverride?: boolean) => {
    try {
      const isCompleted = completedOverride ?? isWorkoutCompleted;

      const userId = await getUserId();
      if (!userId) {
        Alert.alert('Session', 'Please sign in again to save your workout');
        return false;
      }

      if (!isCompleted) {
        const { startDate, endDate } = getTodayRange();
        const todayWorkouts = await WorkoutService.getUserWorkoutsByDateRange(userId, startDate, endDate);
        const existingWorkout = todayWorkouts.find((workout) => workout.name === WORKOUT_NAME);
        if (existingWorkout) {
          await WorkoutService.deleteWorkout(userId, existingWorkout.id);
        }
        setIsWorkoutCompleted(false);
        return true;
      }

      const sets = exercises.flatMap((exercise) =>
        exercise.completedSets.map((set) => ({
          plannedExerciseId: exercise.plannedExerciseId,
          setNumber: set.setNumber,
          actualReps: set.reps,
          actualWeight: set.weight,
        }))
      );

      if (sets.length === 0) {
        Alert.alert('Nothing to save', 'Add at least one completed set before saving.');
        return false;
      }

      const { startDate, endDate } = getTodayRange();
      const todayWorkouts = await WorkoutService.getUserWorkoutsByDateRange(userId, startDate, endDate);
      const existingWorkout = todayWorkouts.find((workout) => workout.name === WORKOUT_NAME);
      if (existingWorkout) {
        await WorkoutService.deleteWorkout(userId, existingWorkout.id);
      }

      const validSets = sets.filter((set) => Number.isInteger(set.plannedExerciseId) && (set.plannedExerciseId as number) > 0);
      if (validSets.length === 0) {
        Alert.alert('Error', 'This plan has no valid planned exercise ids to record.');
        return false;
      }

      for (const set of validSets) {
        await WorkoutPlanService.recordWorkoutSet({
          plannedExerciseId: set.plannedExerciseId as number,
          setNumber: set.setNumber,
          actualReps: set.actualReps,
          actualWeight: set.actualWeight,
          notes,
        });
      }

      setIsWorkoutCompleted(isCompleted);
      return true;
    } catch (error) {
      console.error('Error saving workout progress:', error);
      Alert.alert('Error', 'Failed to save workout progress');
      return false;
    }
  };

  const onSaveWorkout = async () => {
    const success = await saveWorkoutProgress();
    if (success) {
      Alert.alert('Saved', 'Workout progress saved successfully');
    }
  };

  const onToggleCompleted = async () => {
    const success = await saveWorkoutProgress(!isWorkoutCompleted);
    if (success) {
      Alert.alert('Updated', !isWorkoutCompleted ? 'Marked as completed for today' : 'Marked as not completed');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <WorkoutStateCard
            variant="loading"
            title="Loading today's workout..."
            layout="full"
            testID="today-workout-loading"
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
            title="Could not load today's workout"
            description={loadError}
            actionLabel="Retry"
            onAction={loadTodayPlan}
            layout="full"
            testID="today-workout-error"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Today's Workout</Text>
        <Text style={styles.pageSubtitle}>{new Date().toLocaleDateString()}</Text>

        {exercises.length > 0 && (
          <Pressable
            style={[styles.completionToggle, isWorkoutCompleted && styles.completionToggleActive]}
            onPress={onToggleCompleted}
          >
            <Text
              style={[
                styles.completionToggleText,
                isWorkoutCompleted && styles.completionToggleTextActive,
              ]}
            >
              {isWorkoutCompleted ? '✓ Completed today' : '○ Mark as completed today'}
            </Text>
          </Pressable>
        )}

        {/* Exercises List */}
        {exercises.length > 0 ? (
          <View>
            {exercises.map((exercise, exerciseIndex) => (
              <View key={exercise.exerciseId} style={styles.exerciseCard}>
                <Pressable
                  style={styles.exerciseHeader}
                  onPress={() =>
                    setExpandedExerciseId(
                      expandedExerciseId === exercise.exerciseId ? null : exercise.exerciseId
                    )
                  }
                >
                  <View>
                    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                    <Text style={styles.exerciseMeta}>
                      Target: {exercise.targetSets} sets x {exercise.targetReps} reps @ {exercise.targetWeight}kg
                    </Text>
                  </View>
                  <Text style={[styles.exerciseStatus, { color: getStatusColor(exercise) }]}>
                    {getExerciseStatus(exercise)}
                  </Text>
                </Pressable>

                {/* Expanded Sets */}
                {expandedExerciseId === exercise.exerciseId && (
                  <View style={styles.expandedContent}>
                    {exercise.completedSets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.setRow}>
                        <Text style={styles.setLabel}>Set {set.setNumber}</Text>
                        <View style={styles.setInputs}>
                          <TextInput
                            style={styles.setInput}
                            placeholder="Reps"
                            keyboardType="number-pad"
                            value={set.reps.toString()}
                            onChangeText={(val) => updateSet(exerciseIndex, setIndex, 'reps', val)}
                          />
                          <Text style={styles.xLabel}>x</Text>
                          <TextInput
                            style={styles.setInput}
                            placeholder="Weight"
                            keyboardType="decimal-pad"
                            value={set.weight.toString()}
                            onChangeText={(val) => updateSet(exerciseIndex, setIndex, 'weight', val)}
                          />
                          <Text style={styles.unit}>kg</Text>
                        </View>
                        <Pressable
                          style={styles.removeSetButton}
                          onPress={() => removeSet(exerciseIndex, setIndex)}
                        >
                          <Text style={styles.removeSetText}>✕</Text>
                        </Pressable>
                      </View>
                    ))}

                    {exercise.completedSets.length < exercise.targetSets && (
                      <Pressable
                        style={styles.addSetButton}
                        onPress={() => addSet(exerciseIndex)}
                      >
                        <Text style={styles.addSetButtonText}>+ Add Set</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <WorkoutStateCard
            variant="empty"
            title="No exercises planned for today yet."
            actionLabel="Set Up Today"
            onAction={() => navigation.navigate('EditDayPlan', { dayIndex: getTodayIndex() })}
            testID="today-workout-empty"
          />
        )}

        {/* Workout Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did today's workout go?"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save Button */}
        {exercises.length > 0 && (
          <Pressable style={styles.saveButton} onPress={onSaveWorkout}>
            <Text style={styles.saveButtonText}>Save Workout</Text>
          </Pressable>
        )}
      </ScrollView>
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
  },
  pageSubtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 16,
    color: '#8D8E94',
    fontWeight: '500',
  },
  completionToggle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  completionToggleActive: {
    backgroundColor: '#0E8B2A',
    borderColor: '#0E8B2A',
  },
  completionToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E0E10',
  },
  completionToggleTextActive: {
    color: '#FFFFFF',
  },
  /* Exercise Card */
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E0E10',
  },
  exerciseMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#8D8E94',
    fontWeight: '500',
  },
  exerciseStatus: {
    fontSize: 16,
    fontWeight: '800',
  },
  /* Expanded Content */
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopColor: '#E5E5EA',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8D8E94',
    minWidth: 40,
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setInput: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    width: 50,
  },
  xLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8D8E94',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8D8E94',
  },
  removeSetButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
  },
  removeSetText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E43C3C',
  },
  addSetButton: {
    backgroundColor: '#F0F0F3',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  addSetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E0E10',
  },
  /* Notes Section */
  notesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0E10',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '500',
    color: '#0E0E10',
  },
  /* Save Button */
  saveButton: {
    backgroundColor: '#0E0E10',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
