import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as api from '../../api/providerAnalyticsApi';

export function ProviderAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<api.ProviderAnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await api.getProviderAnalytics(30);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setData(res.data.analytics);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  if (loading && !data) {
    return (
      <AppScreen style={{ padding: spacing.xl, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary[600]} />
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="gradient" style={{ padding: spacing.xl, paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}

        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
          Overview (last {data?.period ?? 30} days)
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg }}>
          <Stat label="Leads" value={String(data?.stats.leads.total ?? '—')} />
          <Stat label="Converted" value={String(data?.stats.leads.converted ?? '—')} />
          <Stat label="Conversion" value={`${data?.stats.leads.conversionRate ?? 0}%`} />
          <Stat label="Avg response" value={data?.stats.avgResponseTime ?? '—'} />
          <Stat label="Reviews" value={String(data?.stats.reviews.total ?? '—')} />
          <Stat label="Avg rating" value={String(data?.stats.reviews.averageRating ?? '—')} />
        </View>

        <Text style={{ marginTop: spacing['2xl'], fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
          Top services
        </Text>
        {(data?.topServices ?? []).length === 0 ? (
          <Text style={{ marginTop: spacing.sm, color: colors.text.secondary }}>No data yet.</Text>
        ) : (
          (data?.topServices ?? []).map((s) => (
            <View
              key={s.service}
              style={{
                marginTop: spacing.sm,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.text.primary, fontWeight: typography.fontWeight.semibold }}>{s.label}</Text>
              <Text style={{ marginTop: 2, color: colors.text.muted }}>{s.count} leads</Text>
            </View>
          ))
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </AppScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 140,
      }}
    >
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.muted }}>{label}</Text>
      <Text style={{ marginTop: spacing.xs, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>{value}</Text>
    </View>
  );
}

