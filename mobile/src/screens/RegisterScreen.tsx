import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../AuthContext';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password, phone: phone.trim(), carModel: carModel.trim() });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.hint}>
          Seuls les collègues dont l'email est sur la liste autorisée peuvent s'inscrire.
          Le premier compte créé devient administrateur.
        </Text>

        <TextInput style={styles.input} placeholder="Nom complet" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email professionnel" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Mot de passe (6 caractères min.)" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="Téléphone (optionnel)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextInput style={styles.input} placeholder="Voiture (optionnel, ex : Clio 4)" value={carModel} onChangeText={setCarModel} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  hint: { color: '#64748b', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#dc2626', marginBottom: 8 },
});
