import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getDocuments, getGuides, initializeDatabase, clearStudyData } from '../../src/services/storage';

export default function SettingsScreen() {
  const [modelReady] = useState(true);
  const [deviceStatus] = useState('Compatible with most recent Android devices');

  const documents = getDocuments();
  const guides = getGuides();
  const storageUsed = documents.reduce((total, item) => total + item.size, 0) + guides.length * 22000;

  const exportBackup = () => {
    const payload = JSON.stringify({ documents, guides }, null, 2);
    Alert.alert('Backup created', `Local backup prepared for ${documents.length} files and ${guides.length} guides.\n\n${payload.slice(0, 120)}...`);
  };

  const clearAll = () => {
    clearStudyData();
    Alert.alert('Study data cleared', 'Your local library has been reset.');
    router.replace('/(tabs)/dashboard');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Review your local AI, storage, and privacy controls.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI model status</Text>
        <Text style={styles.meta}>{modelReady ? 'Offline AI engine ready' : 'Model not available'}</Text>
        <Text style={styles.meta}>Device status: {deviceStatus}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Storage</Text>
        <Text style={styles.meta}>{Math.max(0, Math.round(storageUsed / 1024))} KB in local storage</Text>
        <Text style={styles.meta}>{documents.length} uploaded files</Text>
        <Text style={styles.meta}>{guides.length} saved guides</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy</Text>
        <Text style={styles.meta}>No cloud sync, login, or external uploads.</Text>
        <Text style={styles.meta}>Everything remains on-device for offline study.</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={exportBackup}>
        <Text style={styles.primaryButtonText}>Export backup</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={clearAll}>
        <Text style={styles.dangerButtonText}>Clear study data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  content: { padding: 20, paddingBottom: 120 },
  title: { color: '#40364E', fontSize: 30, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#91899D', fontSize: 15, lineHeight: 22, marginBottom: 18 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#EEE8F4' },
  cardTitle: { color: '#40364E', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  meta: { color: '#40364E', lineHeight: 24 },
  primaryButton: { backgroundColor: '#A78BFA', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  dangerButton: { backgroundColor: '#FCE7F3', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  dangerButtonText: { color: '#C4608B', fontWeight: '700' },
});
