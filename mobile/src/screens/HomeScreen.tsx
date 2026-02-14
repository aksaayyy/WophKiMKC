import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { UrlInput } from '../components/UrlInput';
import { OptionsPanel } from '../components/OptionsPanel';
import { ProgressCard } from '../components/ProgressCard';
import { useJobStore } from '../store/jobStore';

export function HomeScreen() {
  const { currentJob } = useJobStore();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="content-cut" size={28} color="#ef4444" />
        <Text style={styles.title}>HookClip</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* URL Input */}
        <UrlInput />

        {/* Progress Card */}
        <ProgressCard />

        {/* Options Panel (hidden when job is running) */}
        {!currentJob && <OptionsPanel />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
