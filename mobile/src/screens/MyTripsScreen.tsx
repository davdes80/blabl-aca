import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, Trip } from '../api';
import { TripCard } from './TripsScreen';

export default function MyTripsScreen({ navigation }: any) {
  const [tab, setTab] = useState<'driving' | 'riding'>('driving');
  const [driving, setDriving] = useState<Trip[]>([]);
  const [riding, setRiding] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api<{ driving: Trip[]; riding: Trip[] }>('/trips/mine');
      setDriving(d.driving);
      setRiding(d.riding);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const trips = tab === 'driving' ? driving : riding;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'driving' && styles.tabActive]} onPress={() => setTab('driving')}>
          <Text style={[styles.tabText, tab === 'driving' && styles.tabTextActive]}>Je conduis ({driving.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'riding' && styles.tabActive]} onPress={() => setTab('riding')}>
          <Text style={[styles.tabText, tab === 'riding' && styles.tabTextActive]}>Je suis passager ({riding.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListEmptyComponent={<Text style={styles.empty}>Rien ici pour l'instant.</Text>}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
