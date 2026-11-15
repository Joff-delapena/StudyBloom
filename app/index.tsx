import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/(tabs)/dashboard');
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/splash-photo.jpg')} style={styles.image} resizeMode="cover" />
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#8B6CCB" />
        <Text style={styles.loadingText}>Loading your study space...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  loading: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#8B6CCB', fontSize: 14, fontWeight: '600', marginTop: 10 },
});
