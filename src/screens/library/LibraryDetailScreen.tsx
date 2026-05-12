import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '../../components/AppScreen';
import { LibraryCover } from '../../components/library/LibraryCover';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { radii } from '../../theme/layout';
import * as libraryApi from '../../api/libraryApi';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import type { LibraryStackParamList } from './LibraryStack';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COVER_WIDTH = SCREEN_WIDTH * 0.38;
const COVER_HEIGHT = COVER_WIDTH * (4 / 3);

function formatPrice(item: any): string {
  const amount = Number(item?.price || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Free';
  return `${item.currency ?? 'USD'} ${amount.toFixed(2)}`;
}

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
}

function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes) return null;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatReadingTime(minutes: number | null | undefined): string | null {
  const v = Number(minutes);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v < 60) return `${Math.round(v)} min read`;
  const h = v / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr read`;
}

export function LibraryDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<LibraryStackParamList, 'LibraryDetail'>>();
  const insets = useSafeAreaInsets();
  const { slug } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [buyingFree, setBuyingFree] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const load = async () => {
    setLoading(true);
    const res = await libraryApi.getLibraryItem(slug);
    setLoading(false);
    if (res.success) setData(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [slug]),
  );

  useLayoutEffect(() => {
    const it = data?.item;
    const t = typeof it?.title === 'string' && it.title.trim() !== '' ? it.title : slug;
    navigation.setOptions({ title: t });
  }, [navigation, data, slug]);

  const pay = async () => {
    setCheckoutLoading(true);
    const res = await libraryApi.libraryStripeCheckout(slug);
    setCheckoutLoading(false);
    if (!res.success) {
      Alert.alert('Checkout', res.message);
      return;
    }
    const url = res.data?.checkout_url;
    if (url) {
      setWebViewLoading(true);
      setCheckoutUrl(url);
    }
  };

  const free = async () => {
    setBuyingFree(true);
    const res = await libraryApi.libraryGrantFree(slug);
    setBuyingFree(false);
    if (!res.success) Alert.alert('Library', res.message);
    else void load();
  };

  const openReader = async () => {
    const res = await libraryApi.getLibraryStreamUrls(slug);
    if (!res.success || !res.data?.stream_urls?.pdf) {
      Alert.alert('Read', res.success ? 'No PDF URL available.' : res.message);
      return;
    }
    setPdfUrl(res.data.stream_urls.pdf);
  };

  const onCheckoutSuccess = (successUrl: string) => {
    setCheckoutUrl(null);
    setLoading(true);

    const sessionIdMatch = successUrl.match(/session_id=([^&]+)/);
    const sessionId = sessionIdMatch?.[1] ?? '';

    const fulfill = async () => {
      if (sessionId) {
        await libraryApi.libraryConfirmCheckout(slug, sessionId);
      }
      await load();
    };

    void fulfill();
  };

  const handleCheckoutNavChange = (event: WebViewNavigation) => {
    const { url } = event;
    if (url.includes('checkout=success')) {
      onCheckoutSuccess(url);
    }
    if (url.includes('checkout=cancelled')) {
      setCheckoutUrl(null);
    }
  };

  const handleCheckoutShouldStart = (event: WebViewNavigation): boolean => {
    const { url } = event;
    if (url.includes('checkout=success')) {
      onCheckoutSuccess(url);
      return false;
    }
    if (url.includes('checkout=cancelled')) {
      setCheckoutUrl(null);
      return false;
    }
    return true;
  };

  // --- Stripe WebView overlay ---
  if (checkoutUrl) {
    return (
      <View style={[s.checkoutContainer, { paddingTop: insets.top }]}>
        <View style={s.checkoutHeader}>
          <Pressable onPress={() => setCheckoutUrl(null)} style={s.checkoutClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={s.checkoutTitle} numberOfLines={1}>Checkout</Text>
          <View style={{ width: 36 }} />
        </View>
        {webViewLoading && (
          <View style={s.checkoutLoader}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={s.checkoutLoaderText}>Loading checkout…</Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          style={{ flex: 1 }}
          onLoadEnd={() => setWebViewLoading(false)}
          onNavigationStateChange={(e) => handleCheckoutNavChange(e)}
          onShouldStartLoadWithRequest={handleCheckoutShouldStart}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={Platform.OS === 'android'}
        />
      </View>
    );
  }

  // --- PDF reader overlay (pdf.js in WebView) ---
  if (pdfUrl && data?.item?.type === 'ebook') {
    const pdfJsHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#F1F5F9;overflow:hidden}
#viewer{width:100%;height:100vh;overflow-y:auto;-webkit-overflow-scrolling:touch}
canvas{display:block;margin:4px auto;box-shadow:0 1px 4px rgba(0,0,0,.12)}
#loading{display:flex;justify-content:center;align-items:center;height:100vh;
  font-family:system-ui;color:#475569;font-size:15px}
#error{display:none;text-align:center;padding:40px;color:#dc2626;font-family:system-ui}
#pageInfo{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);
  background:rgba(0,0,0,.65);color:#fff;padding:5px 14px;border-radius:16px;
  font-size:13px;font-family:system-ui;pointer-events:none;z-index:10;
  transition:opacity .3s}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs" type="module"></script>
</head><body>
<div id="loading">Loading PDF…</div>
<div id="error"></div>
<div id="viewer"></div>
<div id="pageInfo"></div>
<script type="module">
import*as pdfjsLib from'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
const url=${JSON.stringify(pdfUrl)};
const viewer=document.getElementById('viewer');
const loadEl=document.getElementById('loading');
const errEl=document.getElementById('error');
const pageEl=document.getElementById('pageInfo');
let hideTimer;
async function render(){
  try{
    const pdf=await pdfjsLib.getDocument({url,withCredentials:true}).promise;
    loadEl.style.display='none';
    const totalPages=pdf.numPages;
    pageEl.textContent='Page 1 of '+totalPages;
    const dpr=window.devicePixelRatio||1;
    const w=window.innerWidth;
    for(let i=1;i<=totalPages;i++){
      const page=await pdf.getPage(i);
      const vp=page.getViewport({scale:1});
      const scale=(w/vp.width)*dpr;
      const sv=page.getViewport({scale});
      const c=document.createElement('canvas');
      c.width=sv.width;c.height=sv.height;
      c.style.width=w+'px';c.style.height=(sv.height/dpr)+'px';
      c.dataset.page=i;
      viewer.appendChild(c);
      await page.render({canvasContext:c.getContext('2d'),viewport:sv}).promise;
    }
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){
        pageEl.textContent='Page '+e.target.dataset.page+' of '+totalPages;
        pageEl.style.opacity='1';
        clearTimeout(hideTimer);
        hideTimer=setTimeout(()=>{pageEl.style.opacity='0'},1500);
      }});
    },{root:viewer,threshold:0.5});
    viewer.querySelectorAll('canvas').forEach(c=>obs.observe(c));
  }catch(e){
    loadEl.style.display='none';
    errEl.style.display='block';
    errEl.textContent='Could not load PDF.';
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('pdf-error');
  }
}
render();
</script></body></html>`;

    return (
      <View style={[s.readerContainer, { paddingTop: insets.top }]}>
        <View style={s.readerHeader}>
          <Pressable onPress={() => setPdfUrl(null)} style={s.readerBackBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
          <Text style={s.readerTitle} numberOfLines={1}>
            {data?.item?.title ?? 'Reader'}
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <WebView
          source={{ html: pdfJsHtml }}
          style={{ flex: 1, backgroundColor: '#F1F5F9' }}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          mixedContentMode="compatibility"
          originWhitelist={['*']}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'pdf-error') {
              Alert.alert('Reader', 'Could not load the PDF.');
              setPdfUrl(null);
            }
          }}
          onShouldStartLoadWithRequest={() => true}
        />
      </View>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <AppScreen style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </AppScreen>
    );
  }

  const item = data?.item;
  const hasAccess = !!data?.has_access;
  const requiresPaid = !!data?.requires_paid_access;
  const isPaid = requiresPaid || Boolean(item?.is_premium) || Number(item?.price || 0) > 0;
  const cover = resolveMediaUrl(item?.cover_image_url);
  const typeLabel = item?.type === 'ebook' ? 'E-Book' : 'Audiobook';
  const hasAudioCompanion = item?.type === 'ebook' && item?.has_audio_companion;

  const metaChips: { icon: string; label: string }[] = [];
  if (item?.page_count) metaChips.push({ icon: 'document-text-outline', label: `${item.page_count} pages` });
  if (item?.duration_seconds) {
    const d = formatDuration(item.duration_seconds);
    if (d) metaChips.push({ icon: 'time-outline', label: d });
  }
  if (hasAudioCompanion) metaChips.push({ icon: 'musical-notes-outline', label: 'Audio included' });
  if (item?.file_size) {
    const fs = formatFileSize(item.file_size);
    if (fs) metaChips.push({ icon: 'document-outline', label: fs });
  }

  const detailRows: { label: string; value: string }[] = [];
  if (item?.author) detailRows.push({ label: 'Author', value: item.author });
  if (item?.publisher) detailRows.push({ label: 'Publisher', value: item.publisher });
  if (item?.published_at) {
    detailRows.push({ label: 'Published', value: new Date(item.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) });
  } else if (item?.publication_year) {
    detailRows.push({ label: 'Published', value: String(item.publication_year) });
  }
  if (item?.isbn) detailRows.push({ label: 'ISBN', value: item.isbn });
  if (item?.language) detailRows.push({ label: 'Language', value: item.language });
  const rt = formatReadingTime(item?.estimated_reading_minutes);
  if (rt) detailRows.push({ label: 'Reading Time', value: rt });

  return (
    <AppScreen style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero section */}
        <View style={s.hero}>
          <LibraryCover uri={cover} width={COVER_WIDTH} height={COVER_HEIGHT} borderRadius={radii.lg} />
          <View style={s.heroInfo}>
            <View style={s.typeBadge}>
              <Ionicons
                name={item?.type === 'ebook' ? 'book-outline' : 'musical-notes-outline'}
                size={12}
                color={colors.primary[700]}
              />
              <Text style={s.typeBadgeText}>{typeLabel}</Text>
            </View>
            <Text style={s.heroTitle} numberOfLines={3}>{item?.title}</Text>
            {item?.author ? (
              <Text style={s.heroAuthor}>
                <Text style={{ color: colors.text.muted }}>by </Text>
                {item.author}
              </Text>
            ) : null}
            {item?.category?.name ? (
              <View style={s.categoryBadge}>
                <Text style={s.categoryText}>{item.category.name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Meta chips */}
        {metaChips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow} contentContainerStyle={s.chipsContent}>
            {metaChips.map((chip, i) => (
              <View key={i} style={s.chip}>
                <Ionicons name={chip.icon as any} size={14} color={colors.text.muted} />
                <Text style={s.chipText}>{chip.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Price & Action section */}
        <View style={s.actionCard}>
          {hasAccess ? (
            <>
              <View style={s.accessBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={s.accessText}>You have full access</Text>
              </View>
              <Pressable onPress={() => void openReader()} style={s.primaryBtn}>
                <Ionicons name={item?.type === 'ebook' ? 'book-outline' : 'play-outline'} size={18} color="#fff" />
                <Text style={s.primaryBtnText}>
                  {hasAudioCompanion ? 'Read or Listen' : item?.type === 'ebook' ? 'Read Now' : 'Listen Now'}
                </Text>
              </Pressable>
            </>
          ) : isPaid ? (
            <>
              <View style={s.priceRow}>
                <View>
                  <Text style={s.priceLabel}>Price</Text>
                  <Text style={s.priceValue}>{formatPrice(item)}</Text>
                </View>
                <Ionicons name="lock-closed-outline" size={28} color={colors.border} />
              </View>
              <Pressable onPress={() => void pay()} style={s.primaryBtn} disabled={checkoutLoading}>
                {checkoutLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="card-outline" size={18} color="#fff" />
                )}
                <Text style={s.primaryBtnText}>
                  {checkoutLoading ? 'Starting checkout…' : `Continue to Payment · ${formatPrice(item)}`}
                </Text>
              </Pressable>
              <View style={s.secureNote}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
                <Text style={s.secureNoteText}>Secure checkout powered by Stripe</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={s.freeLabel}>This title is free — add it to your library.</Text>
              <Pressable onPress={() => void free()} style={s.primaryBtn} disabled={buyingFree}>
                {buyingFree ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                )}
                <Text style={s.primaryBtnText}>
                  {buyingFree ? 'Adding…' : 'Add to Library'}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Detail rows */}
        {detailRows.length > 0 && (
          <View style={s.detailCard}>
            <Text style={s.sectionTitle}>Details</Text>
            {detailRows.map((row, i) => (
              <View key={i} style={[s.detailRow, i < detailRows.length - 1 && s.detailRowBorder]}>
                <Text style={s.detailLabel}>{row.label}</Text>
                <Text style={s.detailValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {item?.description ? (
          <View style={s.descriptionCard}>
            <Text style={s.sectionTitle}>
              About this {item.type === 'ebook' ? 'book' : 'audiobook'}
            </Text>
            <Text style={s.descriptionText}>{item.description}</Text>
          </View>
        ) : null}

        {/* AI Summary — only visible after purchase */}
        {hasAccess && item?.ai_summary ? (
          <View style={s.descriptionCard}>
            <Text style={s.sectionTitle}>AI Summary</Text>
            <Text style={s.descriptionText}>{item.ai_summary}</Text>
          </View>
        ) : null}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </AppScreen>
  );
}

const s = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
  },
  hero: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  heroInfo: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50] ?? '#EFF6FF',
    borderWidth: 1,
    borderColor: colors.primary[100] ?? '#DBEAFE',
    marginBottom: spacing.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: 26,
  },
  heroAuthor: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: '#475569',
  },
  chipsRow: {
    marginTop: spacing.lg,
  },
  chipsContent: {
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  actionCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: spacing.md,
  },
  accessText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#065F46',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: spacing.md,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: typography.fontSize.xxl ?? 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  freeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: spacing.sm,
  },
  secureNoteText: {
    fontSize: 11,
    color: colors.text.muted,
  },
  detailCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  descriptionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  readerContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  readerBackBtn: {
    padding: spacing.xs,
  },
  readerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  checkoutContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  checkoutClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkoutTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginHorizontal: spacing.sm,
  },
  checkoutLoader: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkoutLoaderText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
});
