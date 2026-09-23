import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EbookShareSheet } from '../../components/library/EbookShareSheet';
import { EbookShareDetailCard } from '../../components/library/EbookShareDetailCard';
import { AppScreen } from '../../components/AppScreen';
import { formatLibraryPrice } from '../../components/library/LibraryBookCard';
import { LibraryCover } from '../../components/library/LibraryCover';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { radii } from '../../theme/layout';
import { shadows } from '../../theme/shadows';
import * as libraryApi from '../../api/libraryApi';
import { alertPaymentsUnavailable, resolveSafeStripeCheckoutUrl } from '../../api/paymentApi';
import { purchaseLibraryTitle } from '../../services/appleIapService';
import { PRICING_LABELS } from '../../config/pricingLabels';
import { mapAppleIapUserMessage } from '../../utils/appleIapErrors';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { isPaidBillingAvailable, shouldUseAppleIap } from '../../utils/platformPayments';
import { EbookPurchaseNote } from '../../components/pricing/EbookPurchaseNote';
import { OneTimePurchaseNote } from '../../components/pricing/OneTimePurchaseNote';
import { PaymentCtaButton } from '../../components/pricing/PaymentCtaButton';
import type { LibraryStackParamList } from './LibraryStack';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COVER_WIDTH = SCREEN_WIDTH * 0.34;
const COVER_HEIGHT = COVER_WIDTH * (4 / 3);
const COVER_WIDTH_COMPACT = 96;
const COVER_HEIGHT_COMPACT = 128;

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

function libraryAddedSuccessMessage(type: string | undefined): string {
  if (type === 'ebook') {
    return 'Thank you! The ebook is now in your library. You can start reading anytime.';
  }
  return 'Thank you! The audiobook is now in your library. You can start listening anytime.';
}

function summarizeUrl(value: string | null | undefined): string {
  if (!value) return '—';
  const q = value.indexOf('?');
  const safe = q >= 0 ? `${value.slice(0, q)}?…` : value;
  return safe.length > 220 ? `${safe.slice(0, 220)}…` : safe;
}

function normalizeStreamUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const streamUrl = new URL(value);
    const apiBaseUrl = new URL(BASE_URL);

    if (
      apiBaseUrl.protocol === 'https:' &&
      streamUrl.protocol === 'http:' &&
      streamUrl.host === apiBaseUrl.host
    ) {
      streamUrl.protocol = 'https:';
    }

    return streamUrl.toString();
  } catch {
    return value;
  }
}

function logPdfReader(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(`[LibraryReader] ${message}`, details);
    return;
  }
  console.log(`[LibraryReader] ${message}`);
}

function logPdfReaderError(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.error(`[LibraryReader] ${message}`, details);
    return;
  }
  console.error(`[LibraryReader] ${message}`);
}

function DetailActionBlock({
  hasAccess,
  isPaid,
  item,
  hasAudioCompanion,
  checkoutLoading,
  buyingFree,
  redeemingCoupon,
  appleBillingReady,
  couponAvailable,
  availableInRegion,
  onRead,
  onPay,
  onFree,
  onRedeemCoupon,
  compact,
}: {
  hasAccess: boolean;
  isPaid: boolean;
  item: any;
  hasAudioCompanion: boolean;
  checkoutLoading: boolean;
  buyingFree: boolean;
  redeemingCoupon: boolean;
  appleBillingReady: boolean;
  couponAvailable: boolean;
  availableInRegion: boolean;
  onRead: () => void;
  onPay: () => void;
  onFree: () => void;
  onRedeemCoupon: () => void;
  compact?: boolean;
}) {
  const price = formatLibraryPrice(item);

  if (!availableInRegion && !hasAccess) {
    return (
      <View style={[s.regionBlocked, compact && s.regionBlockedCompact]}>
        <Ionicons name="globe-outline" size={20} color={colors.text.muted} />
        <Text style={[s.regionBlockedText, compact && s.regionBlockedTextCompact]}>
          This title is not available in your region.
        </Text>
      </View>
    );
  }

  if (hasAccess) {
    return (
      <>
        {!compact ? (
          <View style={s.accessBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={s.accessText}>Full access</Text>
          </View>
        ) : null}
        <Pressable onPress={onRead} style={[s.primaryBtn, compact && s.primaryBtnCompact]}>
          <Ionicons name={item?.type === 'ebook' ? 'book-outline' : 'play-outline'} size={18} color="#fff" />
          <Text style={s.primaryBtnText}>
            {hasAudioCompanion ? 'Read or Listen' : item?.type === 'ebook' ? 'Read Now' : 'Listen Now'}
          </Text>
        </Pressable>
      </>
    );
  }

  if (isPaid) {
    const isEbook = item?.type === 'ebook';
    const payLabel = isEbook ? PRICING_LABELS.buyEbook : `Pay ${price}`;

    return (
      <>
        {!compact ? (
          isEbook ? (
            <View style={s.priceRow}>
              <View style={{ flex: 1 }}>
                <EbookPurchaseNote
                  price={Number(item?.price ?? 0)}
                  currency={item?.currency ?? 'USD'}
                />
              </View>
              <Ionicons name="lock-closed-outline" size={22} color={colors.border} />
            </View>
          ) : (
            <View style={s.priceRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.priceLabel}>Price</Text>
                <Text style={s.priceValue}>{price}</Text>
                <OneTimePurchaseNote />
              </View>
              <Ionicons name="lock-closed-outline" size={22} color={colors.border} />
            </View>
          )
        ) : (
          <View style={s.compactPriceBlock}>
            {isEbook ? (
              <EbookPurchaseNote
                price={Number(item?.price ?? 0)}
                currency={item?.currency ?? 'USD'}
                compact
                center
              />
            ) : (
              <>
                <Text style={s.compactPriceValue}>{price}</Text>
                <OneTimePurchaseNote compact center />
              </>
            )}
          </View>
        )}
        {couponAvailable ? (
          <>
            <Pressable
              onPress={onRedeemCoupon}
              style={[s.couponBtn, compact && s.couponBtnCompact]}
              disabled={redeemingCoupon}
            >
              {redeemingCoupon ? (
                <ActivityIndicator size="small" color={colors.primary[700]} />
              ) : (
                <Ionicons name="gift-outline" size={18} color={colors.primary[700]} />
              )}
              <Text style={s.couponBtnText}>
                {redeemingCoupon ? 'Redeeming…' : 'Unlock with free signup coupon'}
              </Text>
            </Pressable>
            {!compact ? (
              <Text style={s.couponHint}>Use the one-time code from your welcome email.</Text>
            ) : null}
          </>
        ) : null}
        <PaymentCtaButton
          label={!appleBillingReady ? PRICING_LABELS.unavailable : isEbook ? PRICING_LABELS.buyEbook : payLabel}
          onPress={onPay}
          disabled={checkoutLoading || !appleBillingReady}
          loading={checkoutLoading}
          loadingLabel={PRICING_LABELS.processing}
          style={[compact && s.primaryBtnCompact]}
        />
      </>
    );
  }

  return (
    <>
      {!compact ? <Text style={s.freeLabel}>This title is free — add it to your library.</Text> : null}
      <Pressable onPress={onFree} style={[s.primaryBtn, compact && s.primaryBtnCompact]} disabled={buyingFree}>
        {buyingFree ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
        )}
        <Text style={s.primaryBtnText}>{buyingFree ? 'Adding…' : compact ? 'Add Free' : 'Add to Library'}</Text>
      </Pressable>
    </>
  );
}

export function LibraryDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList, 'LibraryDetail'>>();
  const route = useRoute<RouteProp<LibraryStackParamList, 'LibraryDetail'>>();
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const isProvider = role === 'provider';
  const { slug } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [buyingFree, setBuyingFree] = useState(false);
  const [redeemingCoupon, setRedeemingCoupon] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await libraryApi.getLibraryItem(slug);
    setLoading(false);
    if (res.success) {
      setData(res.data);
      return;
    }
    setData(null);
    setError(res.message || 'Could not load this title.');
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

  const isReaderMode = !!pdfUrl && data?.item?.type === 'ebook';

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !isReaderMode });
  }, [navigation, isReaderMode]);

  useEffect(() => {
    navigation.setParams({ slug, readerMode: isReaderMode });
  }, [navigation, slug, isReaderMode]);

  useEffect(() => {
    if (data?.item?.type !== 'ebook' || data?.item?.ai_summary) {
      return;
    }

    const interval = setInterval(async () => {
      const res = await libraryApi.getLibraryItem(slug);
      if (res.success && res.data?.item?.ai_summary) {
        setData(res.data);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [slug, data?.item?.type, data?.item?.ai_summary]);

  const useAppleIap = shouldUseAppleIap();
  const appleProductId =
    typeof data?.apple_product_id === 'string' && data.apple_product_id.trim() !== ''
      ? data.apple_product_id.trim()
      : null;
  const couponAvailable = data?.ebook_coupon_available === true;
  const itemPriceCents = Math.round(Number(data?.item?.price ?? 0) * 100);
  const appleBillingReady = isPaidBillingAvailable({
    priceCents: itemPriceCents,
    appleProductId,
    appleIapConfigured: data?.apple_iap_configured === true,
    stripeReady: data?.stripe_configured,
  });

  const pay = async () => {
    if (checkoutLoading) return;

    setCheckoutLoading(true);
    try {
      if (useAppleIap) {
        if (!appleBillingReady) {
          Alert.alert(
            'Purchase',
            __DEV__ && !appleProductId
              ? 'Ebook purchase is not configured.'
              : PRICING_LABELS.itemUnavailable,
          );
          return;
        }
        await purchaseLibraryTitle(slug, appleProductId!, itemPriceCents);
        const refreshed = await libraryApi.getLibraryItem(slug);
        if (refreshed.success) {
          setData(refreshed.data);
        }
        if (refreshed.success && refreshed.data.has_access) {
          Alert.alert('Purchase', libraryAddedSuccessMessage(data?.item?.type));
        } else {
          Alert.alert(
            'Purchase',
            'Purchase completed, but we could not refresh your access. Please tap Restore Purchases or try again.',
          );
        }
        return;
      }

      const res = await libraryApi.libraryStripeCheckout(slug);
      if (!res.success) {
        Alert.alert('Checkout', res.message);
        return;
      }
      const url = res.data?.checkout_url;
      const safeUrl = resolveSafeStripeCheckoutUrl(url);
      if (safeUrl) {
        setWebViewLoading(true);
        setCheckoutUrl(safeUrl);
      } else if (url) {
        alertPaymentsUnavailable();
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'Purchase cancelled.') {
        return;
      }
      const message = mapAppleIapUserMessage(e, 'library-purchase');
      if (message) {
        Alert.alert('Purchase', message);
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const free = async () => {
    setBuyingFree(true);
    const res = await libraryApi.libraryGrantFree(slug);
    setBuyingFree(false);
    if (!res.success) Alert.alert('Library', res.message);
    else void load();
  };

  const redeemCoupon = async () => {
    if (redeemingCoupon) return;
    setRedeemingCoupon(true);
    try {
      const res = await libraryApi.redeemEbookCoupon(slug);
      if (!res.success) {
        Alert.alert('Coupon', res.message);
        return;
      }
      await load();
      Alert.alert('Coupon', libraryAddedSuccessMessage('ebook'));
    } finally {
      setRedeemingCoupon(false);
    }
  };

  const openReader = async () => {
    logPdfReader('Requesting stream URLs', { slug });
    const res = await libraryApi.getLibraryStreamUrls(slug);
    const streamData = res.success ? res.data : null;
    const rawPdfUrl = streamData?.stream_urls?.pdf ?? null;
    const nextPdfUrl = normalizeStreamUrl(rawPdfUrl);

    logPdfReader('Stream URL response received', {
      slug,
      success: res.success,
      message: res.message,
      hasPdfUrl: !!nextPdfUrl,
      rawPdfUrl: summarizeUrl(rawPdfUrl),
      pdfUrl: summarizeUrl(nextPdfUrl),
      expiresInSeconds: streamData?.expires_in_seconds ?? null,
    });

    if (rawPdfUrl && nextPdfUrl && rawPdfUrl !== nextPdfUrl) {
      logPdfReader('Normalized insecure stream URL to HTTPS', {
        slug,
        from: summarizeUrl(rawPdfUrl),
        to: summarizeUrl(nextPdfUrl),
      });
    }

    if (!res.success || !nextPdfUrl) {
      logPdfReaderError('Cannot open reader: missing PDF URL', {
        slug,
        success: res.success,
        message: res.message,
        responseKeys: streamData ? Object.keys(streamData) : [],
      });
      Alert.alert('Read', res.success ? 'No PDF URL available.' : res.message);
      return;
    }
    setPdfUrl(nextPdfUrl);
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
      Alert.alert('Purchase', libraryAddedSuccessMessage(data?.item?.type));
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
  if (isReaderMode) {
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
const post=(type,payload={})=>{
  try{
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({
      scope:'pdf-reader',
      type,
      ...payload,
    }));
  }catch(_){}
};
function stringifyError(error){
  if(!error) return 'Unknown error';
  if(typeof error==='string') return error;
  if(error instanceof Error) return error.message||error.name||'Unknown error';
  try{return JSON.stringify(error);}catch(_){return String(error);}
}
async function fetchPdfBytes(){
  post('log',{
    step:'fetch-start',
    url,
    origin:window.location.origin,
    baseURI:document.baseURI,
  });
  const response=await fetch(url,{
    method:'GET',
    credentials:'omit',
    headers:{Accept:'application/pdf,*/*'},
  });
  const contentType=response.headers.get('Content-Type')||'';
  post('log',{
    step:'fetch-response',
    status:response.status,
    ok:response.ok,
    contentType,
  });
  if(!response.ok){
    throw new Error('PDF request failed with status '+response.status);
  }
  if(contentType.toLowerCase().includes('text/html')){
    throw new Error('PDF request returned HTML instead of a PDF.');
  }
  const bytes=await response.arrayBuffer();
  post('log',{step:'fetch-bytes',byteLength:bytes.byteLength});
  if(!bytes.byteLength){
    throw new Error('PDF response was empty.');
  }
  return new Uint8Array(bytes);
}
async function render(){
  try{
    post('log',{
      step:'bootstrap',
      userAgent:navigator.userAgent,
      origin:window.location.origin,
      baseURI:document.baseURI,
      url,
    });
    const data=await fetchPdfBytes();
    post('log',{step:'pdfjs-load-start',byteLength:data.byteLength});
    const pdf=await pdfjsLib.getDocument({data}).promise;
    loadEl.style.display='none';
    const totalPages=pdf.numPages;
    post('ready',{totalPages});
    pageEl.textContent='Page 1 of '+totalPages;
    const dpr=window.devicePixelRatio||1;
    const w=window.innerWidth;
    for(let i=1;i<=totalPages;i++){
      if(i===1||i===totalPages||i%5===0){
        post('log',{step:'render-progress',page:i,totalPages});
      }
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
    post('log',{step:'render-complete',totalPages});
  }catch(e){
    const message=stringifyError(e);
    loadEl.style.display='none';
    errEl.style.display='block';
    errEl.textContent='Could not load PDF. '+message;
    post('error',{
      message,
      name:e&&typeof e==='object'&&'name'in e?String(e.name):null,
      stack:e&&typeof e==='object'&&'stack'in e?String(e.stack).slice(0,2000):null,
      url,
      origin:window.location.origin,
      baseURI:document.baseURI,
    });
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
          source={{ html: pdfJsHtml, baseUrl: BASE_URL }}
          style={{ flex: 1, backgroundColor: '#F1F5F9' }}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          mixedContentMode="compatibility"
          originWhitelist={['*']}
          onLoadStart={() => {
            logPdfReader('Reader WebView load started', {
              slug,
              pdfUrl: summarizeUrl(pdfUrl),
              baseUrl: BASE_URL,
            });
          }}
          onLoadEnd={() => {
            logPdfReader('Reader WebView load ended', {
              slug,
              pdfUrl: summarizeUrl(pdfUrl),
            });
          }}
          onMessage={(event) => {
            const raw = event.nativeEvent.data;
            let payload: Record<string, unknown> | null = null;

            try {
              payload = JSON.parse(raw) as Record<string, unknown>;
            } catch {
              payload = null;
            }

            if (!payload || payload.scope !== 'pdf-reader') {
              if (raw === 'pdf-error') {
                logPdfReaderError('Reader reported a legacy pdf-error event', {
                  slug,
                  pdfUrl: summarizeUrl(pdfUrl),
                });
                Alert.alert('Reader', 'Could not load the PDF.');
                setPdfUrl(null);
              }
              return;
            }

            const type = typeof payload.type === 'string' ? payload.type : 'unknown';
            if (type === 'error') {
              logPdfReaderError('Reader render failed', payload);
              const message =
                typeof payload.message === 'string' && payload.message.trim() !== ''
                  ? payload.message
                  : 'Could not load the PDF.';
              Alert.alert('Reader', message);
              setPdfUrl(null);
              return;
            }

            logPdfReader(`Reader event: ${type}`, payload);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            logPdfReaderError('Reader WebView onError', {
              slug,
              description: nativeEvent.description,
              code: nativeEvent.code,
              url: nativeEvent.url,
            });
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            logPdfReaderError('Reader WebView onHttpError', {
              slug,
              statusCode: nativeEvent.statusCode,
              description: nativeEvent.description,
              url: nativeEvent.url,
            });
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

  if (error || !data?.item) {
    return (
      <AppScreen style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.text.muted} />
        <Text style={{ marginTop: spacing.md, fontSize: typography.fontSize.md, color: colors.text.secondary, textAlign: 'center' }}>
          {error || 'This title could not be found.'}
        </Text>
        <Pressable onPress={() => void load()} style={{ marginTop: spacing.lg }}>
          <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.primary[600] }}>
            Try again
          </Text>
        </Pressable>
      </AppScreen>
    );
  }

  const item = data.item;
  const shareCampaign = data?.share_campaign;
  const hasAccess = !!data?.has_access;
  const availableInRegion = data?.available_in_region !== false;
  const canShareForReward =
    item?.type === 'ebook' &&
    shareCampaign?.can_start === true &&
    shareCampaign?.rewarded !== true;
  const bookAlreadyShared = Array.isArray(shareCampaign?.events)
    ? shareCampaign.events.some((event: any) => event.slug === slug && event.status === 'confirmed')
    : false;
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

  const coverWidth = isProvider ? COVER_WIDTH_COMPACT : COVER_WIDTH;
  const coverHeight = isProvider ? COVER_HEIGHT_COMPACT : COVER_HEIGHT;
  const providerDetailRows = isProvider
    ? detailRows.filter((row) => ['Author', 'Published', 'Reading Time'].includes(row.label))
    : detailRows;

  const actionBlock = (
    <DetailActionBlock
      hasAccess={hasAccess}
      isPaid={isPaid}
      item={item}
      hasAudioCompanion={hasAudioCompanion}
      checkoutLoading={checkoutLoading}
      buyingFree={buyingFree}
      redeemingCoupon={redeemingCoupon}
      appleBillingReady={appleBillingReady}
      couponAvailable={couponAvailable}
      availableInRegion={availableInRegion}
      onRead={() => void openReader()}
      onPay={() => void pay()}
      onFree={() => void free()}
      onRedeemCoupon={() => void redeemCoupon()}
      compact={isProvider}
    />
  );

  return (
    <AppScreen style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[s.scroll, isProvider && s.scrollCompact]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.hero, isProvider && s.heroCompact]}>
          <LibraryCover uri={cover} width={coverWidth} height={coverHeight} borderRadius={radii.lg} />
          <View style={[s.heroInfo, isProvider && s.heroInfoCompact]}>
            <View style={[s.heroBadges, isProvider && s.heroBadgesCompact]}>
              <View style={s.typeBadge}>
                <Ionicons
                  name={item?.type === 'ebook' ? 'book-outline' : 'musical-notes-outline'}
                  size={12}
                  color={colors.primary[700]}
                />
                <Text style={s.typeBadgeText}>{typeLabel}</Text>
              </View>
              {item?.category?.name ? (
                <View style={s.categoryBadge}>
                  <Text style={s.categoryText}>{item.category.name}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[s.heroTitle, isProvider && s.heroTitleCompact]} numberOfLines={isProvider ? 2 : 3}>
              {item?.title}
            </Text>
            {item?.author ? (
              <Text style={[s.heroAuthor, isProvider && s.heroAuthorCompact]} numberOfLines={1}>
                {isProvider ? item.author : (
                  <>
                    <Text style={{ color: colors.text.muted }}>by </Text>
                    {item.author}
                  </>
                )}
              </Text>
            ) : null}
            {isProvider && isPaid && !hasAccess ? (
              item?.type === 'ebook' ? (
                <EbookPurchaseNote
                  price={Number(item?.price ?? 0)}
                  currency={item?.currency ?? 'USD'}
                  compact
                  center
                  style={s.heroOneTimeNote}
                />
              ) : (
                <>
                  <Text style={s.heroPrice}>{formatLibraryPrice(item)}</Text>
                  <OneTimePurchaseNote compact center style={s.heroOneTimeNote} />
                </>
              )
            ) : null}
            {isProvider && hasAccess ? (
              <View style={s.accessBadgeInline}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={s.accessTextInline}>Owned</Text>
              </View>
            ) : null}
          </View>
        </View>

        {metaChips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[s.chipsRow, isProvider && s.chipsRowCompact]}
            contentContainerStyle={s.chipsContent}
          >
            {metaChips.map((chip, i) => (
              <View key={i} style={[s.chip, isProvider && s.chipCompact]}>
                <Ionicons name={chip.icon as any} size={13} color={colors.text.muted} />
                <Text style={[s.chipText, isProvider && s.chipTextCompact]}>{chip.label}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {!isProvider ? <View style={s.actionCard}>{actionBlock}</View> : null}

        {providerDetailRows.length > 0 ? (
          <View style={[s.detailCard, isProvider && s.detailCardCompact]}>
            {!isProvider ? <Text style={s.sectionTitle}>Details</Text> : null}
            {providerDetailRows.map((row, i) => (
              <View
                key={row.label}
                style={[
                  s.detailRow,
                  isProvider && s.detailRowCompact,
                  i < providerDetailRows.length - 1 && s.detailRowBorder,
                ]}
              >
                <Text style={[s.detailLabel, isProvider && s.detailLabelCompact]}>{row.label}</Text>
                <Text style={[s.detailValue, isProvider && s.detailValueCompact]} numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {item?.description ? (
          <View style={[s.descriptionCard, isProvider && s.descriptionCardCompact]}>
            <Text style={[s.sectionTitle, isProvider && s.sectionTitleCompact]}>
              {isProvider ? 'About' : `About this ${item.type === 'ebook' ? 'book' : 'audiobook'}`}
            </Text>
            <Text style={[s.descriptionText, isProvider && s.descriptionTextCompact]}>{item.description}</Text>
          </View>
        ) : null}

        {item?.type === 'ebook' ? (
          <View style={[s.descriptionCard, isProvider && s.descriptionCardCompact]}>
            <Text style={[s.sectionTitle, isProvider && s.sectionTitleCompact]}>AI Summary</Text>
            {item.ai_summary ? (
              <Text style={[s.descriptionText, isProvider && s.descriptionTextCompact]}>{item.ai_summary}</Text>
            ) : (
              <Text style={[s.descriptionText, isProvider && s.descriptionTextCompact]}>
                Summary will appear here when ready.
              </Text>
            )}
          </View>
        ) : null}

        {canShareForReward ? (
          <EbookShareDetailCard
            confirmedShares={shareCampaign?.confirmed_shares || 0}
            requiredShares={shareCampaign?.required_shares || 5}
            bookAlreadyShared={bookAlreadyShared}
            onShare={() => setShareSheetVisible(true)}
            onViewCampaign={() => navigation.navigate('EbookShareCampaign')}
          />
        ) : null}

        <View style={{ height: isProvider ? 100 + insets.bottom : spacing['3xl'] }} />
      </ScrollView>

      {isProvider ? (
        <View style={[s.stickyFooter, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          {actionBlock}
        </View>
      ) : null}

      <EbookShareSheet
        visible={shareSheetVisible}
        slug={slug}
        title={item?.title || slug}
        onClose={() => setShareSheetVisible(false)}
        onUpdated={(campaign) => {
          setData((prev: any) => (prev ? { ...prev, share_campaign: campaign } : prev));
        }}
      />
    </AppScreen>
  );
}

const s = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
  },
  scrollCompact: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hero: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  heroCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroInfo: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  heroInfoCompact: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 0,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  heroBadgesCompact: {
    justifyContent: 'center',
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
  heroTitleCompact: {
    fontSize: typography.fontSize.lg,
    lineHeight: 22,
    textAlign: 'center',
  },
  heroAuthor: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  heroAuthorCompact: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  heroPrice: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  accessBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  accessTextInline: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#059669',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
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
  chipsRowCompact: {
    marginTop: spacing.md,
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
  chipCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  chipTextCompact: {
    fontSize: 11,
  },
  actionCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.softLg,
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
  regionBlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionBlockedCompact: {
    justifyContent: 'center',
  },
  regionBlockedText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  regionBlockedTextCompact: {
    flex: 0,
    textAlign: 'center',
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
    fontSize: typography.fontSize['2xl'] ?? 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  couponBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary[200] ?? '#BFDBFE',
    backgroundColor: colors.primary[50] ?? '#EFF6FF',
  },
  couponBtnCompact: {
    paddingVertical: 10,
  },
  couponBtnText: {
    color: colors.primary[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  couponHint: {
    marginBottom: spacing.sm,
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'center',
  },
  compactPriceBlock: {
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  compactPriceValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    textAlign: 'center',
  },
  heroOneTimeNote: {
    marginTop: spacing.xs,
    maxWidth: 280,
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
  primaryBtnCompact: {
    paddingVertical: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  detailCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  detailCardCompact: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sectionTitleCompact: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailRowCompact: {
    paddingVertical: 6,
  },
  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  detailLabelCompact: {
    fontSize: typography.fontSize.xs,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  detailValueCompact: {
    fontSize: typography.fontSize.xs,
  },
  descriptionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  descriptionCardCompact: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  descriptionTextCompact: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
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
