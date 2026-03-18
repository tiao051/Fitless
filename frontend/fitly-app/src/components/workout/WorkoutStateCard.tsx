import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type WorkoutStateCardProps = {
  variant: 'loading' | 'error' | 'empty';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  layout?: 'full' | 'inline';
  testID?: string;
};

export function WorkoutStateCard({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  layout = 'inline',
  testID,
}: WorkoutStateCardProps) {
  return (
    <View style={[styles.container, layout === 'full' ? styles.containerFull : styles.containerInline]} testID={testID}>
      {variant === 'loading' && <ActivityIndicator size="large" color="#0E0E10" testID={testID ? `${testID}-spinner` : undefined} />}

      <Text style={[styles.title, layout === 'inline' && styles.titleInline]}>{title}</Text>

      {!!description && <Text style={styles.description}>{description}</Text>}

      {actionLabel && onAction && variant !== 'loading' && (
        <Pressable style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerFull: {
    marginHorizontal: 20,
    paddingVertical: 24,
  },
  containerInline: {
    paddingVertical: 28,
  },
  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#0E0E10',
    textAlign: 'center',
  },
  titleInline: {
    fontSize: 16,
    marginTop: 0,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#8D8E94',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: '#0E0E10',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
