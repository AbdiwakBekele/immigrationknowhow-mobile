import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import * as videosApi from '../../api/videosApi';
import type { VideosStackParamList } from './VideosStack';

export function VideosListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VideosStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await videosApi.listVideos({ per_page: 20 });
    setLoading(false);
    if (!res.success) return;
    const v = res.data?.videos;
    setRows(v?.data ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  return (
    <AppScreen style={{ padding: spacing.xl }}>
      <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Videos</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary[600]} />
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={rows}
          keyExtractor={(r) => String(r.slug)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('VideoDetail', { slug: item.slug })}
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
              <Text style={{ marginTop: spacing.xs, color: colors.text.muted, fontSize: typography.fontSize.sm }}>{item.platform}</Text>
            </Pressable>
          )}
        />
      )}
    </AppScreen>
  );
}
