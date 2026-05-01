import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as reviewsApi from '../../api/reviewsApi';

export function ReviewsListScreen() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await reviewsApi.listMyReviews();
    setLoading(false);
    if (!res.success) return;
    const r = res.data?.reviews;
    setRows(r?.data ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>My reviews</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={rows}
          keyExtractor={(r) => r.uuid}
          ListEmptyComponent={<Text style={{ color: colors.text.secondary }}>No reviews yet.</Text>}
          renderItem={({ item }) => (
            <View style={{ padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}>
              <Text style={{ fontWeight: typography.fontWeight.semibold }}>{item.service_provider?.business_name ?? 'Provider'}</Text>
              <Text style={{ marginTop: spacing.xs, color: colors.text.secondary }}>Rating: {item.rating}</Text>
              <Text style={{ marginTop: spacing.sm, color: colors.text.primary }}>{item.comment}</Text>
            </View>
          )}
        />
      )}
    </AppScreen>
  );
}
