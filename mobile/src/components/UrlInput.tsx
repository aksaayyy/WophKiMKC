import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useJobStore } from '../store/jobStore';

export function UrlInput() {
  const [url, setUrl] = useState('');
  const { createJob, isLoading, error, clearError } = useJobStore();

  const handleSubmit = async () => {
    if (!url.trim()) return;
    clearError();
    await createJob(url.trim());
  };

  const handlePaste = async () => {
    // In real app, use Clipboard API
    // const text = await Clipboard.getStringAsync();
    // setUrl(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>YouTube URL</Text>
      <View style={styles.inputContainer}>
        <MaterialIcons name="link" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor="#666"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {url.length > 0 && (
          <TouchableOpacity onPress={() => setUrl('')} style={styles.clearButton}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={16} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!url.trim() || isLoading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!url.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons name="content-cut" size={20} color="#fff" />
            <Text style={styles.submitText}>Generate Clips</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ff444420',
    borderRadius: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
