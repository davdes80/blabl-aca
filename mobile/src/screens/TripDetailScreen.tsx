import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, Comment, Passenger, Trip } from '../api';
import { useAuth } from '../AuthContext';

export default function TripDetailScreen({ route, navigation }: any) {
  const { tripId } = route.params;
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ trip: Trip }>(`/trips/${tripId}`);
      setTrip(d.trip);
    } catch (e: any) {
      Alert.alert('Erreur', e.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !trip) {
    return <ActivityIndicator style={{ marginTop: 48 }} size="large" color="#2563eb" />;
  }

  const isDriver = user && trip.driverId === user.id;
  const myBooking = trip.passengers?.find((p) => p.user_id === user?.id);
  const isPassenger = !!myBooking && myBooking.status === 'confirmed';
  const full = trip.seatsLeft !== null && trip.seatsLeft <= 0;

  const book = async () => {
    setBusy(true);
    try {
      const d = await api<{ trip: Trip }>(`/trips/${trip.id}/bookings`, { method: 'POST' });
      setTrip(d.trip);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = async () => {
    if (!myBooking) return;
    setBusy(true);
    try {
      const d = await api<{ trip: Trip }>(`/bookings/${myBooking.booking_id}`, { method: 'DELETE' });
      setTrip(d.trip);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelTrip = () => {
    Alert.alert('Supprimer ce trajet ?', 'Les réservations seront annulées.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/trips/${trip.id}`, { method: 'DELETE' });
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Erreur', e.message);
          }
        },
      },
    ]);
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      const d = await api<{ trip: Trip }>(`/trips/${trip.id}/comments`, {
        method: 'POST',
        body: { body: comment.trim() },
      });
      setTrip(d.trip);
      setComment('');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={trip.comments || []}
        keyExtractor={(c: Comment) => String(c.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            <Text style={styles.route}>
              {trip.fromCity} → {trip.toCity}
            </Text>
            <Text style={styles.meta}>
              {trip.date} à {trip.time} ·{' '}
              {full ? 'Complet' : `${trip.seatsLeft ?? trip.seats} place(s) restante(s)`}
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conducteur</Text>
              <Text style={styles.line}>
                👤 {trip.driverName}
                {trip.driverCar ? ` · 🚙 ${trip.driverCar}` : ''}
              </Text>
              {trip.driverPhone ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${trip.driverPhone}`)}>
                  <Text style={styles.link}>📞 {trip.driverPhone}</Text>
                </TouchableOpacity>
              ) : null}
              {trip.notes ? <Text style={styles.notes}>{trip.notes}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Passagers ({trip.passengers?.filter((p: Passenger) => p.status === 'confirmed').length}/{trip.seats})
              </Text>
              {trip.passengers?.length === 0 && <Text style={styles.line}>Personne pour l'instant.</Text>}
              {trip.passengers?.map((p: Passenger) => (
                <Text key={p.booking_id} style={styles.line}>
                  • {p.name}
                  {p.user_id === user?.id ? ' (toi)' : ''}
                </Text>
              ))}
            </View>

            {isDriver ? (
              <TouchableOpacity style={[styles.button, styles.danger]} onPress={cancelTrip}>
                <Text style={styles.buttonText}>Supprimer ce trajet</Text>
              </TouchableOpacity>
            ) : isPassenger ? (
              <TouchableOpacity style={[styles.button, styles.danger]} onPress={cancelBooking} disabled={busy}>
                <Text style={styles.buttonText}>Annuler ma réservation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.button} onPress={book} disabled={busy || full}>
                <Text style={styles.buttonText}>{full ? 'Complet' : 'Réserver ma place'}</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Messages</Text>
          </>
        }
        renderItem={({ item }: { item: Comment }) => (
          <View style={styles.comment}>
            <Text style={styles.commentAuthor}>{item.author_name}</Text>
            <Text>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.line}>Aucun message.</Text>}
        ListFooterComponent={
          <View style={styles.commentForm}>
            <TextInput
              style={styles.input}
              placeholder="Écrire un message…"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendComment} disabled={busy}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  route: { fontSize: 22, fontWeight: '800' },
  meta: { color: '#64748b', marginTop: 4 },
  section: { marginTop: 18, backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  line: { marginTop: 2 },
  notes: { marginTop: 8, color: '#475569', fontStyle: 'italic' },
  link: { color: '#2563eb', marginTop: 4 },
  button: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 18 },
  danger: { backgroundColor: '#dc2626' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  comment: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginTop: 8 },
  commentAuthor: { fontWeight: '700', fontSize: 13, color: '#2563eb', marginBottom: 2 },
  commentForm: { marginTop: 12, marginBottom: 24 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, minHeight: 60, textAlignVertical: 'top' },
  sendButton: { backgroundColor: '#2563eb', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
});
