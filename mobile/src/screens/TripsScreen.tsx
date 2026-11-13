import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, Trip } from '../api';

function formatTrip(t: Trip) {
  const d = new Date(`${t.date}T${t.time}`);
  const dateStr = isNaN(d.getTime())
    ? `${t.date} à ${t.time}`
    : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ' · ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return dateStr;
}

export function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const full = trip.seatsLeft !== null && trip.seatsLeft <= 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.routeRow}>
        <Text style={styles.city}>{trip.fromCity}</Text>
        <Text style={styles.arrow}> → </Text>
        <Text style={styles.city}>{trip.toCity}</Text>
      </View>
      <Text style={styles.meta}>{formatTrip(trip)}</Text>
      <View style={styles.row}>
        <Text style={styles.driver}>👤 {trip.driverName}</Text>
        <Text style={[styles.seats, full && styles.full]}>
          {full ? 'Complet' : `${trip.seatsLeft ?? trip.seats} place(s)`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TripsScreen({ navigation }: any) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [from, setFrom] = useState('');

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const q = from.trim() ? `?from=${encodeURIComponent(from.trim())}` : '';
      const d = await api<{ trips: Trip[] }>(`/trips${q}`);
      setTrips(d.trips);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [from]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [from]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Ville de départ…"
        value={from}
        onChangeText={setFrom}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun trajet à venir. Publie le premier !</Text>
          }
          renderItem={({ item }) => (
            <TripCard trip={item} onPress={() => navigation.navigate('TripDetail', { tripId: item.id })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  search: { margin: 16, marginBottom: 4, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, backgroundColor: '#fff', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  routeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  city: { fontSize: 17, fontWeight: '700' },
  arrow: { color: '#2563eb', fontWeight: '700' },
  meta: { color: '#64748b', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  driver: { color: '#334155' },
  seats: { color: '#16a34a', fontWeight: '600' },
  full: { color: '#dc2626' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
