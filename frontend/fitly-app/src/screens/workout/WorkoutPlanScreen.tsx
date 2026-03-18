import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DayPlan = {
  day: string;
  exercises: Array<{
    exerciseId: number;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
    targetWeight: number;
  }>;
  isRestDay: boolean;
};

export default function WorkoutPlanScreen({ navigation }: any) {
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Initialize weekly plan from AsyncStorage
  useEffect(() => {
    const loadWeekPlan = async () => {
      try {
        const saved = await AsyncStorage.getItem('weeklyPlan');
        if (saved) {
          setWeekPlan(JSON.parse(saved));
        } else {
          // Default empty plan
          setWeekPlan(days.map((day) => ({
            day,
            exercises: [],
            isRestDay: false,
          })));
        }
      } catch (error) {
        console.error('Error loading week plan:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeekPlan();
  }, []);

  const getTodayIndex = () => {
    const today = new Date().getDay();
    return (today + 6) % 7; // Convert Sunday=0 to Monday=0
  };

  const today = days[getTodayIndex()];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#0E0E10" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Weekly Plan</Text>
        <Text style={styles.pageSubtitle}>Plan your workouts for the week</Text>

        {/* Weekly Calendar */}
        <View style={styles.weekGrid}>
          {weekPlan.map((dayPlan, index) => {
            const isToday = dayPlan.day === today;
            const exerciseCount = dayPlan.exercises.length;
            const isPlanned = dayPlan.isRestDay || exerciseCount > 0;

            return (
              <Pressable
                key={dayPlan.day}
                style={[
                  styles.dayCard,
                  isPlanned ? styles.dayCardPlanned : styles.dayCardUnplanned,
                  isToday && styles.dayCardToday,
                ]}
                onPress={() => navigation.navigate('EditDayPlan', { dayIndex: index })}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isPlanned && styles.dayLabelOnDark,
                    !isPlanned && styles.dayLabelOnLight,
                  ]}
                  numberOfLines={1}
                >
                  {dayPlan.day.slice(0, 3)}
                </Text>
                {dayPlan.isRestDay ? (
                  <Text
                    style={[styles.dayStatus, isPlanned && styles.dayStatusOnDark]}
                    numberOfLines={1}
                  >
                    Rest
                  </Text>
                ) : exerciseCount > 0 ? (
                  <Text
                    style={[styles.dayStatus, isPlanned && styles.dayStatusOnDark]}
                    numberOfLines={1}
                  >
                    {`${exerciseCount} ex`}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Today's Workout Quick View */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>

          {weekPlan[getTodayIndex()]?.isRestDay ? (
            <View style={styles.restDayCard}>
              <Text style={styles.restDayEmoji}>😴</Text>
              <Text style={styles.restDayText}>Rest Day - Recover well!</Text>
            </View>
          ) : weekPlan[getTodayIndex()]?.exercises.length ? (
            <View>
              {weekPlan[getTodayIndex()].exercises.map((ex, idx) => (
                <View key={idx} style={styles.exercisePreview}>
                  <View>
                    <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                    <Text style={styles.exerciseMeta}>
                      {ex.targetSets} sets x {ex.targetReps} reps @ {ex.targetWeight}kg
                    </Text>
                  </View>
                  <Text style={styles.exerciseStatus}>0/0</Text>
                </View>
              ))}

              <Pressable
                style={styles.startButton}
                onPress={() => navigation.navigate('TodayWorkout')}
              >
                <Text style={styles.startButtonText}>Start Workout</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No workout planned for today</Text>
              <Pressable
                style={styles.planButton}
                onPress={() => navigation.navigate('EditDayPlan', { dayIndex: getTodayIndex() })}
              >
                <Text style={styles.planButtonText}>Plan Now</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Edit Plan Button */}
        <Pressable
          style={styles.editButton}
          onPress={() => navigation.navigate('EditWeeklyPlan')}
        >
          <Text style={styles.editButtonText}>Edit Full Plan</Text>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
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
  /* Week Grid */
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 28,
    rowGap: 8,
  },
  dayCard: {
    width: '23%',
    borderWidth: 2,
    borderColor: '#D7D7DC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardPlanned: {
    backgroundColor: '#0E0E10',
    borderColor: '#0E0E10',
  },
  dayCardUnplanned: {
    backgroundColor: '#EFEFF3',
    borderColor: '#DBDBE0',
  },
  dayCardToday: {
    borderColor: '#0E0E10',
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  dayLabelOnDark: {
    color: '#FFFFFF',
  },
  dayLabelOnLight: {
    color: '#6D6E74',
  },
  dayStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6D6E74',
  },
  dayStatusOnDark: {
    color: '#FFFFFF',
  },
  /* Today Section */
  todaySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E0E10',
    marginBottom: 12,
  },
  restDayCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 18,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8D8E94',
  },
  exercisePreview: {
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
  exerciseStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E0E10',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8D8E94',
    marginBottom: 12,
  },
  planButton: {
    backgroundColor: '#0E0E10',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  startButton: {
    marginTop: 14,
    backgroundColor: '#0E0E10',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0E0E10',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#0E0E10',
    fontSize: 16,
    fontWeight: '700',
  },
});
