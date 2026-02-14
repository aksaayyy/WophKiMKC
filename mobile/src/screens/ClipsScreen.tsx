import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
// import * as FileSystem from 'expo-file-system';
import { useJobStore } from '../store/jobStore';
import { jobsApi } from '../api/client';
import type { Clip } from '../types';

export function ClipsScreen() {
  const { currentJob } = useJobStore();
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const clips = currentJob?.clips || [];

  const handleDownload = async (clip: Clip) => {
    try {
      setDownloading(clip.filename);
      const url = jobsApi.getClipUrl(currentJob!.id, clip.filename);
      
      // For now, just share the URL
      // In production, you'd download the file using native modules
      await Share.share({
        message: `Download clip: ${url}`,
        url: url,
      });
    } catch (error) {
      Alert.alert('Download Failed', 'Could not download the clip');
    } finally {
      setDownloading(null);
    }
  };

  const handleShare = async (clip: Clip) => {
    try {
      const url = jobsApi.getClipUrl(currentJob!.id, clip.filename);
      await Share.share({
        message: `Check out this clip: ${url}`,
        url: url,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const renderClip = ({ item, index }: { item: Clip; index: number }) => (
    <View style={styles.clipCard}>
      <View style={styles.clipHeader}>
        <View style={styles.clipNumber}>
          <Text style={styles.clipNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.clipInfo}>
          <Text style={styles.clipTime}>
            Starts at {Math.floor(item.startTime / 60)}:{String(item.startTime % 60).padStart(2, '0')}
          </Text>
          <Text style={styles.clipScore}>Score: {(item.score * 100).toFixed(0)}%</Text>
        </View>
      </View>

      {/* Video Player */}
      <Video
        source={{ uri: jobsApi.getClipUrl(currentJob!.id, item.filename) }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        useNativeControls
        isLooping
      />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDownload(item)}
          disabled={downloading === item.filename}
        >
          <MaterialIcons
            name={downloading === item.filename ? 'hourglass-empty' : 'download'}
            size={20}
            color="#fff"
          />
          <Text style={styles.actionText}>
            {downloading === item.filename ? 'Downloading...' : 'Download'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={() => handleShare(item)}
        >
          <MaterialIcons name="share" size={20} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!currentJob || currentJob.status !== 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons name="videocam-off" size={48} color="#666" />
          <Text style={styles.emptyText}>No clips yet</Text>
          <Text style={styles.emptySubtext}>
            Create a job from the home screen to generate clips
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Clips</Text>
        <Text style={styles.headerSubtitle}>
          {clips.length} clip{clips.length !== 1 ? 's' : ''} generated
        </Text>
      </View>

      <FlatList
        data={clips}
        renderItem={renderClip}
        keyExtractor={(item) => item.filename}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  clipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  clipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  clipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  clipInfo: {
    marginLeft: 12,
  },
  clipTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  clipScore: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  video: {
    width: '100%',
    height: 280,
    backgroundColor: '#000',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  shareButton: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
