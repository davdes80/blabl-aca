import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [carModel, setCarModel] = useState(user?.carModel || '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setCarModel(user?.carModel || '');
  }, [user]);

  const save = async () => {
    setBusy(true);
    try {
      await api('/auth/me', { method: 'PATCH', body: { name, phone, carModel } });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{user?.email}</Text>
      {user?.isAdmin && <Text style={styles.badge}>Administrateur</Text>}

      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Téléphone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Text style={styles.label}>Voiture</Text>
      <TextInput style={styles.input} value={carModel} onChangeText={setCarModel} />

      <TouchableOpacity style={styles.button} onPress={save} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{saved ? 'Enregistré ✓' : 'Enregistrer'}</Text>}
      </TouchableOpacity>

      {user?.isAdmin && <AdminSection />}

      <TouchableOpacity style={styles.logout} onPress={signOut}>
        <Text style={{ color: '#dc2626', fontWeight: '600' }}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

function AdminSection() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [grist, setGrist] = useState<'unknown' | 'on' | 'off'>('unknown');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, g] = await Promise.all([
        api<{ emails: { email: string }[] }>('/admin/allowed-emails'),
        api<{ configured: boolean }>('/admin/grist-status'),
      ]);
      setEmails(a.emails.map((e) => e.email));
      setGrist(g.configured ? 'on' : 'off');
    } catch {
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    setBusy(true);
    try {
      await api('/admin/allowed-emails', { method: 'POST', body: { email: newEmail.trim() } });
      setNewEmail('');
      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (email: string) => {
    try {
      await api(`/admin/allowed-emails/${encodeURIComponent(email)}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const syncGrist = async () => {
    setBusy(true);
    try {
      const r = await api<{ total: number }>('/admin/sync-grist', { method: 'POST' });
      Alert.alert('Synchro Grist', `${r.total} email(s) autorisé(s) importé(s).`);
      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.admin}>
      <Text style={styles.adminTitle}>Gestion des accès</Text>
      <Text style={styles.label}>Ajouter un email autorisé</Text>
      <View style={styles.addRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="collegue@entreprise.fr" autoCapitalize="none" keyboardType="email-address" value={newEmail} onChangeText={setNewEmail} />
        <TouchableOpacity style={styles.addButton} onPress={add} disabled={busy}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={emails}
        keyExtractor={(e) => e}
        style={{ maxHeight: 180 }}
        ListEmptyComponent={<Text style={styles.muted}>Aucun email autorisé manuellement.</Text>}
        renderItem={({ item }) => (
          <View style={styles.emailRow}>
            <Text style={{ flex: 1 }}>{item}</Text>
            <TouchableOpacity onPress={() => remove(item)}>
              <Text style={{ color: '#dc2626' }}>Retirer</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {grist === 'on' && (
        <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={syncGrist} disabled={busy}>
          <Text style={styles.buttonText}>Synchroniser depuis Grist</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  email: { color: '#64748b' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#dbeafe', color: '#1d4ed8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 6, overflow: 'hidden', fontWeight: '700', fontSize: 12 },
  label: { fontSize: 13, color: '#475569', marginTop: 14, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 16 },
  button: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logout: { marginTop: 24, alignItems: 'center', padding: 12 },
  admin: { marginTop: 28, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  adminTitle: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addButton: { backgroundColor: '#2563eb', borderRadius: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  muted: { color: '#94a3b8', paddingVertical: 8 },
});
