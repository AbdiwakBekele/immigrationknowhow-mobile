import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/AppScreen';
import { EbookShareCampaignPanel } from '../../components/library/EbookShareCampaignPanel';
import { colors } from '../../theme/colors';
import * as ebookShareApi from '../../api/ebookShareApi';
import type { LibraryStackParamList } from './LibraryStack';

export function EbookShareCampaignScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await ebookShareApi.getShareCampaign();
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setCampaign(res.data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <AppScreen style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>{error}</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={{ flex: 1 }}>
      <EbookShareCampaignPanel
        campaign={campaign}
        browseLabel="Browse library"
        onBrowse={() => navigation.navigate('LibraryMy')}
      />
    </AppScreen>
  );
}
