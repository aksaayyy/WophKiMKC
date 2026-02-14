import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useJobStore } from '../store/jobStore';
import { PLATFORMS, DETECTION_MODES, type Platform, type DetectionMode } from '../types';

export function OptionsPanel() {
  const { options, setOptions } = useJobStore();

  const updateClipCount = (delta: number) => {
    const newCount = Math.max(1, Math.min(10, options.clipCount + delta));
    setOptions({ clipCount: newCount });
  };

  const updateClipDuration = (delta: number) => {
    const newDuration = Math.max(15, Math.min(90, options.clipDuration + delta));
    setOptions({ clipDuration: newDuration });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Platform Selection */}
      <Text style={styles.sectionTitle}>Platform</Text>
      <View style={styles.platformContainer}>
        {PLATFORMS.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            style={[
              styles.platformButton,
              options.platform === platform.id && styles.platformButtonActive,
            ]}
            onPress={() => setOptions({ platform: platform.id })}
          >
            <MaterialIcons
              name={platform.icon as any}
              size={20}
              color={options.platform === platform.id ? '#ef4444' : '#666'}
            />
            <Text
              style={[
                styles.platformText,
                options.platform === platform.id && styles.platformTextActive,
              ]}
            >
              {platform.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Clip Count */}
      <Text style={styles.sectionTitle}>Number of Clips</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => updateClipCount(-1)}
          disabled={options.clipCount <= 1}
        >
          <MaterialIcons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{options.clipCount}</Text>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => updateClipCount(1)}
          disabled={options.clipCount >= 10}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Clip Duration */}
      <Text style={styles.sectionTitle}>Clip Duration (seconds)</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => updateClipDuration(-5)}
          disabled={options.clipDuration <= 15}
        >
          <MaterialIcons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{options.clipDuration}s</Text>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => updateClipDuration(5)}
          disabled={options.clipDuration >= 90}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Detection Mode */}
      <Text style={styles.sectionTitle}>Detection Mode</Text>
      {DETECTION_MODES.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={[
            styles.modeButton,
            options.detectionMode === mode.id && styles.modeButtonActive,
          ]}
          onPress={() => setOptions({ detectionMode: mode.id })}
        >
          <View>
            <Text
              style={[
                styles.modeLabel,
                options.detectionMode === mode.id && styles.modeLabelActive,
              ]}
            >
              {mode.label}
            </Text>
            <Text style={styles.modeDescription}>{mode.description}</Text>
          </View>
          {options.detectionMode === mode.id && (
            <MaterialIcons name="check-circle" size={20} color="#ef4444" />
          )}
        </TouchableOpacity>
      ))}

      {/* Subtitles Toggle */}
      <View style={styles.toggleContainer}>
        <View>
          <Text style={styles.toggleLabel}>Enable Subtitles</Text>
          <Text style={styles.toggleDescription}>Add captions to clips</Text>
        </View>
        <Switch
          value={options.enableSubtitles}
          onValueChange={(value) => setOptions({ enableSubtitles: value })}
          trackColor={{ false: '#333', true: '#ef444450' }}
          thumbColor={options.enableSubtitles ? '#ef4444' : '#666'}
        />
      </View>

      {/* Face Tracking Toggle */}
      <View style={styles.toggleContainer}>
        <View>
          <Text style={styles.toggleLabel}>Face Tracking</Text>
          <Text style={styles.toggleDescription}>Keep faces centered in frame</Text>
        </View>
        <Switch
          value={options.enableFaceTracking}
          onValueChange={(value) => setOptions({ enableFaceTracking: value })}
          trackColor={{ false: '#333', true: '#ef444450' }}
          thumbColor={options.enableFaceTracking ? '#ef4444' : '#666'}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  platformContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  platformButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  platformButtonActive: {
    borderColor: '#ef4444',
    backgroundColor: '#ef444420',
  },
  platformText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  platformTextActive: {
    color: '#ef4444',
    fontWeight: '600',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  counterButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 8,
  },
  counterValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  modeButtonActive: {
    borderColor: '#ef4444',
    backgroundColor: '#ef444420',
  },
  modeLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  modeLabelActive: {
    color: '#ef4444',
  },
  modeDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  toggleDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
});
