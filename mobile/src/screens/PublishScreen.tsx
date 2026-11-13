import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { api } from '../api';

export default function PublishScreen({ navigation }: any) {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('3');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await api('/trips', {
        method: 'POST',
        body: { fromCity, toCity, date, time, seats: Number(seats), notes },
      });
      Alert.alert('Trajet publié ✅', 'Tes collègues peuvent maintenant réserver.', [
        { text: 'OK', onPress: () => navigation.navigate('Trajets') },
      ]);
      setFromCity(''); setToCity(''); setDate(''); setTime(''); setSeats('3'); setNotes('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Proposer un trajet</Text>

        <Text style={styles.label}>Départ</Text>
        <TextInput style={styles.input} placeholder="Ex : Lyon Part-Dieu" value={fromCity} onChangeText={setFromCity} />
        <Text style={styles.label}>Arrivée</Text>
        <TextInput style={styles.input} placeholder="Ex : Siège, Grenoble" value={toCity} onChangeText={setToCity} />

        <Text style={styles.label}>Date (AAAA-MM-JJ)</Text>
        <TextInput style={styles.input} placeholder="2099-06-01" autoCapitalize="none" value={date} onChangeText={setDate} />
        <Text style={styles.label}>Heure (HH:MM)</Text>
        <TextInput style={styles.input} placeholder="08:30" autoCapitalize="none" value={time} onChangeText={setTime} />
        <Text style={styles.label}>Places disponibles</Text>
        <TextInput style={styles.input} placeholder="3" keyboardType="number-pad" value={seats} onChangeText={setSeats} />
        <Text style={styles.label}>Précisions (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Point de rendez-vous, détour possible…"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Publier le trajet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 13, color: '#475569', marginBottom: 4, marginTop: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 16 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#dc2626', marginTop: 8 },
});
