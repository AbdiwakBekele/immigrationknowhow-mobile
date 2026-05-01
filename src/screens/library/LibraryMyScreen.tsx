import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as libraryApi from '../../api/libraryApi';
import type { LibraryStackParamList } from './LibraryStack';

export function LibraryMyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const [tab, setTab] = useState<'purchased' | 'available'>('purchased');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await libraryApi.getMyLibrary(tab, 1);
    setLoading(false);
    if (!res.success) return;
    const raw = res.data?.section === tab ? res.data?.items : res.data?.items;
    const coll = raw?.data ?? [];
    setItems(coll);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [tab])
  );

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: spacing.md }}>
        <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
        My library
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
        <Pressable onPress={() => setTab('purchased')}>
          <Text style={{ fontWeight: tab === 'purchased' ? typography.fontWeight.bold : typography.fontWeight.regular, color: colors.primary[600] }}>
            Purchased
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab('available')}>
          <Text style={{ fontWeight: tab === 'available' ? typography.fontWeight.bold : typography.fontWeight.regular, color: colors.primary[600] }}>
            Browse more
          </Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          keyExtractor={(it) => String(it.slug ?? it.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => item.slug && navigation.navigate('LibraryDetail', { slug: item.slug })}
              style={{
                padding: spacing.lg,
                marginBottom: spacing.md,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>{item.title}</Text>
            </Pressable>
          )}
        />
      )}
    </AppScreen>
  );
}
