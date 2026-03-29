import { View, Text } from 'react-native';

interface ChibiPlaceholderProps {
  showLabel?: boolean;
}

/**
 * Placeholder component for the 3D interactive chibi character.
 * This will be replaced with an actual 3D rendered component later.
 * 
 * Currently displays a minimalist placeholder to reserve space and indicate
 * where the chibi 3D model will be rendered.
 */
export function ChibiPlaceholder({ showLabel = true }: ChibiPlaceholderProps) {
  return (
    <View
      style={{
        aspectRatio: 1,
        backgroundColor: '#FAFAF8',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8E8E6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#F0F0EE',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            opacity: 0.4,
          }}
        >
          🐿️
        </Text>
      </View>
      
      {showLabel && (
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#8A8A88',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            YOUR CHIBI
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#BEBEBE',
              fontStyle: 'italic',
            }}
          >
            3D interactive character
          </Text>
        </View>
      )}
    </View>
  );
}
