import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useJobStore } from '../store/jobStore';

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued',
  downloading: 'Downloading video...',
  analyzing: 'Analyzing content...',
  clipping: 'Generating clips...',
  completed: 'Complete!',
  failed: 'Failed',
};

const STAGE_ICONS: Record<string, string> = {
  queued: 'schedule',
  downloading: 'download',
  analyzing: 'analytics',
  clipping: 'content-cut',
  completed: 'check-circle',
  failed: 'error',
};

export function ProgressCard() {
  const { currentJob, resetCurrentJob } = useJobStore();

  if (!currentJob) return null;

  const progress = currentJob.progress || 0;
  const stage = currentJob.stage || currentJob.status;
  const isComplete = currentJob.status === 'completed';
  const isFailed = currentJob.status === 'failed';

  return (
    <View style={styles.container}>
      {/* Thumbnail */}
      {currentJob.thumbnail && (
        <Image source={{ uri: currentJob.thumbnail }} style={styles.thumbnail} />
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {currentJob.videoTitle}
        </Text>
        <Text style={styles.duration}>
          {Math.floor(currentJob.videoDuration / 60)}m {currentJob.videoDuration % 60}s • {' '}
          {currentJob.clipCount} clips
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
              isFailed && styles.progressFillError,
              isComplete && styles.progressFillComplete,
            ]}
          />
        </View>
        <View style={styles.stageRow}>
          <MaterialIcons
            name={STAGE_ICONS[stage] as any}
            size={16}
            color={isFailed ? '#ff4444' : isComplete ? '#22c55e' : '#ef4444'}
          />
          <Text style={[styles.stageText, isFailed && styles.stageTextError]}>
            {STAGE_LABELS[stage] || stage}
          </Text>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      </View>

      {/* Clips Preview */}
      {currentJob.clips && currentJob.clips.length > 0 && (
        <View style={styles.clipsContainer}>
          <Text style={styles.clipsTitle}>
            Generated {currentJob.clips.length} clip{currentJob.clips.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Close Button */}
      {(isComplete || isFailed) && (
        <TouchableOpacity style={styles.closeButton} onPress={resetCurrentJob}>
          <MaterialIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoContainer: {
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  duration: {
    color: '#666',
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 3,
  },
  progressFillComplete: {
    backgroundColor: '#22c55e',
  },
  progressFillError: {
    backgroundColor: '#ff4444',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  stageText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  stageTextError: {
    color: '#ff4444',
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  clipsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  clipsTitle: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00000060',
    borderRadius: 16,
    padding: 4,
  },
});
