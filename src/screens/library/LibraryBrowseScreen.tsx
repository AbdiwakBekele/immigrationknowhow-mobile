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

export function LibraryBrowseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await libraryApi.browseLibrary({ per_page: 20 });
    setLoading(false);
    if (!res.success) {
      setErr(res.message);
      return;
    }
    setItems(res.data?.items?.data?.data ?? res.data?.items?.data ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          Library
        </Text>
        <Pressable onPress={() => navigation.navigate('LibraryMy')}>
          <Text style={{ color: colors.primary[600], fontWeight: typography.fontWeight.semibold }}>My library</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
      ) : err ? (
        <Text style={{ marginTop: spacing.lg, color: colors.danger }}>{err}</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          keyExtractor={(it) => String(it.slug)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('LibraryDetail', { slug: item.slug })}
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
              <Text style={{ marginTop: spacing.xs, color: colors.text.muted, fontSize: typography.fontSize.sm }}>
                {item.type} · {item.has_access ? 'Unlocked' : item.price != null ? `${item.currency} ${item.price}` : 'Free'}
              </Text>
            </Pressable>
          )}
        />
      )}
    </AppScreen>
  );
}
