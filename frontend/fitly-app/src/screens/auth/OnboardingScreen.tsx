import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  navigation: any;
};

const TOTAL_STEPS = 12;
const PHOTO_GUIDELINES_STEP = 7;

const genders = ['Male', 'Female', 'Other'];
const ethnicities = ['Asian', 'African', 'Caucasian', 'Hispanic', 'Middle Eastern', 'Other'];
const workoutOptions = [
  { label: '0-2', hint: 'Just getting started' },
  { label: '3-5', hint: 'Consistent and balanced' },
  { label: '6+', hint: 'Dedicated athlete' },
];
const methods = ['DEXA Scan', 'BodPod', 'Skin Calipers', 'Body Scanner', 'Other', 'None'];

const ageOptions = Array.from({ length: 78 }, (_, i) => String(i + 13));
const weightMetricOptions = Array.from({ length: 171 }, (_, i) => String(i + 30));
const weightImperialOptions = Array.from({ length: 375 }, (_, i) => String(i + 66));
const heightMetricOptions = Array.from({ length: 121 }, (_, i) => String(i + 100));
const heightImperialOptions = Array.from({ length: 40 }, (_, i) => String(i + 48));

const Progress = ({ step }: { step: number }) => {
  const widthPercent = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${widthPercent}%` }]} />
    </View>
  );
};

export default function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState('25');
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [isMetricWeight, setIsMetricWeight] = useState(true);
  const [isMetricHeight, setIsMetricHeight] = useState(true);
  const [ethnicity, setEthnicity] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<string | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);

  const opacity = useRef(new Animated.Value(1)).current;

  const title = useMemo(() => {
    switch (step) {
      case 0:
        return 'Choose your gender';
      case 1:
        return "What's your age?";
      case 2:
        return "What's your weight?";
      case 3:
        return "What's your height?";
      case 4:
        return 'Choose your ethnicity';
      case 5:
        return 'Track your body more accurately with Fitly';
      case 6:
        return 'Before we gather more information';
      case 7:
        return 'Photo Guidelines';
      case 8:
        return 'Take a front photo';
      case 9:
        return 'Take a back photo';
      case 10:
        return 'How many workouts do you do per week?';
      case 11:
        return 'Have you had professional body composition measurements done?';
      default:
        return "You're All Set";
    }
  }, [step]);

  const subtitle =
    step <= 4 || step === 8 || step === 9 || step === 10 || step === 11
      ? 'This will help us personalize your body analysis and provide more accurate measurements!'
      : step === 6
      ? "We'll need two photos of you to provide accurate measurements and analysis."
      : '';

  const canContinue = () => {
    if (step === 0) return !!gender;
    if (step === 4) return !!ethnicity;
    if (step === 8) return frontUploaded;
    if (step === 9) return backUploaded;
    if (step === 10) return !!workouts;
    if (step === 11) return !!method;
    return true;
  };

  const animateAndSetStep = (nextStep: number) => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setStep(nextStep);
  };

  const onBack = () => {
    if (step === 0) {
      navigation.navigate('Welcome');
      return;
    }
    animateAndSetStep(step - 1);
  };

  const onNext = () => {
    if (!canContinue()) return;

    if (step < TOTAL_STEPS - 1) {
      animateAndSetStep(step + 1);
    } else {
      navigation.navigate('Register');
    }
  };

  const onPhotoNext = () => {
    if (!canContinue()) {
      Alert.alert('Photo required', 'Please upload a photo before continuing.');
      return;
    }
    onNext();
  };

  const openCamera = async (isFront: boolean) => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      Alert.alert('Camera access needed', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      if (isFront) {
        setFrontUploaded(true);
      } else {
        setBackUploaded(true);
      }
    }
  };

  const openLibrary = async (isFront: boolean) => {
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPermission.granted) {
      Alert.alert('Photo library access needed', 'Please allow photo library access to choose a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      if (isFront) {
        setFrontUploaded(true);
      } else {
        setBackUploaded(true);
      }
    }
  };

  const handlePickPhoto = (isFront: boolean) => {
    Alert.alert('Add photo', 'Choose how you want to add your photo.', [
      { text: 'Take photo', onPress: () => openCamera(isFront) },
      { text: 'Choose from library', onPress: () => openLibrary(isFront) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderOptionButton = (
    value: string,
    selected: string | null,
    setSelected: (next: string) => void,
    hint?: string
  ) => (
    <Pressable
      key={value}
      style={[styles.optionButton, selected === value && styles.optionButtonSelected]}
      onPress={() => setSelected(value)}
    >
      <Text style={[styles.optionTitle, selected === value && styles.optionTitleSelected]}>{value}</Text>
      {hint ? <Text style={styles.optionHint}>{hint}</Text> : null}
    </Pressable>
  );

  const renderStepContent = () => {
    if (step === 0) {
      return <View>{genders.map((item) => renderOptionButton(item, gender, setGender))}</View>;
    }

    if (step === 1) {
      return (
        <View style={styles.pickerBox}>
          <Text style={styles.pickerLabel}>Age</Text>
          <Picker selectedValue={age} onValueChange={setAge} style={styles.pickerControl} itemStyle={styles.pickerItem}>
            {ageOptions.map((value) => (
              <Picker.Item key={value} label={`${value} years`} value={value} />
            ))}
          </Picker>
        </View>
      );
    }

    if (step === 2) {
      const options = isMetricWeight ? weightMetricOptions : weightImperialOptions;
      return (
        <View>
          <View style={styles.unitToggleRow}>
            <Text style={[styles.unitLabel, !isMetricWeight && styles.unitLabelMuted]}>Imperial</Text>
            <Pressable
              style={styles.toggle}
              onPress={() => {
                const nextMetric = !isMetricWeight;
                setIsMetricWeight(nextMetric);
                setWeight(nextMetric ? '70' : '154');
              }}
            >
              <View style={[styles.toggleThumb, isMetricWeight && styles.toggleThumbRight]} />
            </Pressable>
            <Text style={[styles.unitLabel, isMetricWeight && styles.unitLabelMuted]}>Metric</Text>
          </View>

          <View style={styles.pickerBox}>
            <Text style={styles.pickerLabel}>Weight</Text>
            <Picker selectedValue={weight} onValueChange={setWeight} style={styles.pickerControl} itemStyle={styles.pickerItem}>
              {options.map((value) => (
                <Picker.Item key={value} label={`${value} ${isMetricWeight ? 'kg' : 'lb'}`} value={value} />
              ))}
            </Picker>
          </View>
        </View>
      );
    }

    if (step === 3) {
      const options = isMetricHeight ? heightMetricOptions : heightImperialOptions;
      return (
        <View>
          <View style={styles.unitToggleRow}>
            <Text style={[styles.unitLabel, !isMetricHeight && styles.unitLabelMuted]}>Imperial</Text>
            <Pressable
              style={styles.toggle}
              onPress={() => {
                const nextMetric = !isMetricHeight;
                setIsMetricHeight(nextMetric);
                setHeight(nextMetric ? '170' : '67');
              }}
            >
              <View style={[styles.toggleThumb, isMetricHeight && styles.toggleThumbRight]} />
            </Pressable>
            <Text style={[styles.unitLabel, isMetricHeight && styles.unitLabelMuted]}>Metric</Text>
          </View>

          <View style={styles.pickerBox}>
            <Text style={styles.pickerLabel}>Height</Text>
            <Picker selectedValue={height} onValueChange={setHeight} style={styles.pickerControl} itemStyle={styles.pickerItem}>
              {options.map((value) => (
                <Picker.Item key={value} label={`${value} ${isMetricHeight ? 'cm' : 'in'}`} value={value} />
              ))}
            </Picker>
          </View>
        </View>
      );
    }

    if (step === 4) {
      return <View>{ethnicities.map((item) => renderOptionButton(item, ethnicity, setEthnicity))}</View>;
    }

    if (step === 5) {
      return (
        <View style={styles.compareWrap}>
          <View style={styles.barCol}>
            <View style={[styles.barTrack, { backgroundColor: '#E5E5EA' }]}>
              <View style={[styles.barFill, { height: '15%', backgroundColor: '#CFCFD4' }]} />
            </View>
            <Text style={styles.compareLabel}>Traditional</Text>
          </View>
          <View style={styles.barCol}>
            <View style={[styles.barTrack, { backgroundColor: '#E5E5EA' }]}>
              <View style={[styles.barFill, { height: '65%', backgroundColor: '#000' }]} />
            </View>
            <Text style={styles.compareLabel}>Fitly</Text>
          </View>
        </View>
      );
    }

    if (step === 6) {
      return (
        <View style={styles.centerBlock}>
          <View style={styles.cameraGlyphWrap}>
            <Text style={styles.cameraGlyph}>📷</Text>
          </View>
        </View>
      );
    }

    if (step === PHOTO_GUIDELINES_STEP) {
      return (
        <View>
          {[
            'Two photos required (front and back)',
            'Wear fitted clothing for better analysis',
            'Make sure full body is visible in frame',
            'Use good and even lighting',
          ].map((item) => (
            <View key={item} style={styles.guidelineCard}>
              <Text style={styles.guidelineText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (step === 8 || step === 9) {
      const isFront = step === 8;
      const uploaded = isFront ? frontUploaded : backUploaded;

      return (
        <View>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoHint}>{isFront ? 'Front body preview' : 'Back body preview'}</Text>
          </View>

          <Pressable style={styles.uploadButton} onPress={() => handlePickPhoto(isFront)}>
            <Text style={styles.uploadButtonText}>Upload or take a photo</Text>
          </Pressable>

          {uploaded ? <Text style={styles.uploadedText}>Photo ready</Text> : null}

          <Pressable
            style={[styles.photoNextButton, !uploaded && styles.photoNextButtonDisabled]}
            onPress={onPhotoNext}
            disabled={!uploaded}
          >
            <Text style={styles.photoNextButtonText}>Next</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 10) {
      return <View>{workoutOptions.map((item) => renderOptionButton(item.label, workouts, setWorkouts, item.hint))}</View>;
    }

    if (step === 11) {
      return <View>{methods.map((item) => renderOptionButton(item, method, setMethod))}</View>;
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Progress step={step} />
      </View>

      <Animated.View style={{ flex: 1, opacity }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, step === PHOTO_GUIDELINES_STEP && styles.alertTitle]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.stepArea}>{renderStepContent()}</View>
        </ScrollView>
      </Animated.View>

      {step !== 8 && step !== 9 ? (
        <View style={styles.footer}>
          <Pressable style={[styles.nextButton, !canContinue() && styles.nextButtonDisabled]} onPress={onNext}>
            <Text style={styles.nextButtonText}>{step === TOTAL_STEPS - 1 ? 'Start with Fitly' : 'Next'}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 34,
    lineHeight: 34,
    color: '#111',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 100,
    backgroundColor: '#DFDFE3',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0E0E10',
    borderRadius: 100,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    paddingTop: 18,
    paddingBottom: 20,
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
    color: '#0D0D0F',
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  alertTitle: {
    color: '#E43C3C',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: '#8D8E94',
    marginBottom: 18,
  },
  stepArea: {
    minHeight: 360,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#111',
    borderRadius: 18,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F5F5F7',
  },
  optionButtonSelected: {
    backgroundColor: '#0F1013',
    borderColor: '#0F1013',
  },
  optionTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: '#111',
  },
  optionTitleSelected: {
    color: '#FFF',
  },
  optionHint: {
    marginTop: 4,
    fontSize: 15,
    color: '#8D8E94',
  },
  pickerBox: {
    borderWidth: 2,
    borderColor: '#111',
    borderRadius: 22,
    minHeight: 240,
    backgroundColor: '#FFF',
    paddingTop: 10,
    overflow: 'hidden',
  },
  pickerLabel: {
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '700',
    color: '#111',
    marginTop: 8,
  },
  pickerControl: {
    height: 180,
  },
  pickerItem: {
    fontSize: 24,
    color: '#111',
  },
  unitToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  unitLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  unitLabelMuted: {
    color: '#8D8E94',
  },
  toggle: {
    width: 86,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#111',
    padding: 4,
  },
  toggleThumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
  },
  toggleThumbRight: {
    marginLeft: 'auto',
  },
  compareWrap: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  barCol: {
    alignItems: 'center',
  },
  barTrack: {
    width: 100,
    height: 280,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 24,
  },
  compareLabel: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 92,
  },
  cameraGlyphWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF2FF',
  },
  cameraGlyph: {
    fontSize: 36,
  },
  guidelineCard: {
    borderWidth: 2,
    borderColor: '#111',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: '#F5F5F7',
  },
  guidelineText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: '#111',
  },
  photoPlaceholder: {
    height: 290,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    backgroundColor: '#ECECEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  photoHint: {
    fontSize: 20,
    fontWeight: '700',
    color: '#52545D',
  },
  uploadButton: {
    backgroundColor: '#0E0E10',
    borderWidth: 2,
    borderColor: '#0E0E10',
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  uploadedText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 15,
    color: '#0E8B2A',
    fontWeight: '700',
  },
  photoNextButton: {
    alignSelf: 'center',
    marginTop: 12,
    minHeight: 42,
    minWidth: 132,
    paddingHorizontal: 20,
    borderRadius: 21,
    backgroundColor: '#0D0D0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNextButtonDisabled: {
    backgroundColor: '#A9A9B0',
  },
  photoNextButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 18,
  },
  nextButton: {
    minHeight: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0F',
  },
  nextButtonDisabled: {
    backgroundColor: '#A9A9B0',
  },
  nextButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.2,
  },
});
