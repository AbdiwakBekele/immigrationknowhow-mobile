import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import type { CommunityPostPayload } from '../../api/communityApi';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  directVideoPlayerHtml,
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  youtubeVideoIdFromUrl,
} from '../../utils/communityDisplay';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

type Props = {
  post: Pick<CommunityPostPayload, 'id' | 'image_url' | 'video_url'>;
  /** Feed cards use a fixed aspect; detail view can be taller. */
  variant?: 'feed' | 'detail';
  /** Opens the post when tapping an image (feed). */
  onMediaPress?: () => void;
  /** Start playback immediately (e.g. post detail). */
  autoPlay?: boolean;
};

/** width / height — higher value = shorter media block */
const FEED_MEDIA_ASPECT = 8 / 5;
const DETAIL_MEDIA_ASPECT = 4 / 5;

const webViewProps = {
  allowsFullscreenVideo: true,
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserAction: false,
  javaScriptEnabled: true,
  domStorageEnabled: true,
  scrollEnabled: false,
} as const;

function CommunityInlineVideo({
  style,
  youtubeId,
  videoUrl,
  autoPlay,
}: {
  style: StyleProp<ViewStyle>;
  youtubeId?: string | null;
  videoUrl?: string | null;
  autoPlay: boolean;
}) {
  const source = useMemo(() => {
    if (youtubeId) {
      return { uri: youtubeEmbedUrl(youtubeId, autoPlay) };
    }
    const resolved = resolveMediaUrl(videoUrl);
    if (!resolved) return null;
    return { html: directVideoPlayerHtml(resolved, autoPlay) };
  }, [autoPlay, videoUrl, youtubeId]);

  if (!source) return null;

  return (
    <View style={style}>
      <WebView source={source} style={styles.mediaFill} {...webViewProps} />
    </View>
  );
}

function VideoPlayThumbnail({
  frameStyle,
  thumbUri,
  onPlay,
}: {
  frameStyle: StyleProp<ViewStyle>;
  thumbUri?: string | null;
  onPlay: () => void;
}) {
  return (
    <Pressable
      onPress={onPlay}
      style={frameStyle}
      accessibilityRole="button"
      accessibilityLabel="Play video"
    >
      {thumbUri ? (
        <Image source={{ uri: thumbUri }} style={styles.mediaFill} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.mediaFill, styles.videoTapPlaceholder]}>
          <Ionicons name="videocam-outline" size={40} color={colors.text.muted} />
        </View>
      )}
      <View style={styles.playOverlay}>
        <Ionicons name="play-circle" size={64} color="#fff" />
      </View>
      <View style={styles.videoBadge}>
        <Text style={styles.videoBadgeText}>Video</Text>
      </View>
    </Pressable>
  );
}

export function CommunityPostMedia({ post, variant = 'feed', onMediaPress, autoPlay = false }: Props) {
  const youtubeId = youtubeVideoIdFromUrl(post.video_url);
  const videoUrl = post.video_url?.trim() || null;
  const imageUri = useMemo(() => resolveMediaUrl(post.image_url), [post.image_url]);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(Boolean(imageUri));
  const [playing, setPlaying] = useState(autoPlay);

  useEffect(() => {
    setPlaying(autoPlay);
  }, [post.id, post.video_url, autoPlay]);

  const frameStyle = [styles.mediaFrame, variant === 'detail' ? styles.mediaFrameDetail : null];
  const shouldPlay = playing || (variant === 'detail' && autoPlay);

  if (imageUri && !imageFailed) {
    const content = (
      <View style={frameStyle}>
        {imageLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.primary[600]} />
          </View>
        ) : null}
        <Image
          source={{ uri: imageUri }}
          style={styles.mediaFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          onLoadStart={() => setImageLoading(true)}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageFailed(true);
            setImageLoading(false);
          }}
        />
      </View>
    );

    if (onMediaPress) {
      return (
        <Pressable onPress={onMediaPress} accessibilityRole="imagebutton">
          {content}
        </Pressable>
      );
    }

    return content;
  }

  if (videoUrl) {
    const thumbUri = youtubeId ? youtubeThumbnailUrl(youtubeId) : resolveMediaUrl(post.image_url);

    if (variant === 'feed' && !shouldPlay) {
      return (
        <VideoPlayThumbnail
          frameStyle={frameStyle}
          thumbUri={thumbUri}
          onPlay={() => setPlaying(true)}
        />
      );
    }

    if (youtubeId || resolveMediaUrl(videoUrl)) {
      const playerStyle = variant === 'detail' ? [frameStyle, styles.videoFrame] : frameStyle;
      return (
        <CommunityInlineVideo
          style={playerStyle}
          youtubeId={youtubeId}
          videoUrl={youtubeId ? null : videoUrl}
          autoPlay={shouldPlay}
        />
      );
    }

    return (
      <Pressable
        onPress={() => setPlaying(true)}
        style={[frameStyle, styles.videoTap]}
        accessibilityRole="button"
        accessibilityLabel="Play video"
      >
        <Ionicons name="play-circle" size={56} color={colors.primary[600]} />
        <Text style={styles.videoTapText}>Tap to play video</Text>
      </Pressable>
    );
  }

  return (
    <View style={[frameStyle, styles.placeholder]}>
      <Ionicons name="images-outline" size={36} color={colors.text.muted} />
      <Text style={styles.placeholderText}>No media</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mediaFrame: {
    width: '100%',
    aspectRatio: FEED_MEDIA_ASPECT,
    maxHeight: 210,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  mediaFrameDetail: {
    aspectRatio: DETAIL_MEDIA_ASPECT,
    maxHeight: 480,
  },
  mediaFill: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  videoFrame: {
    aspectRatio: 16 / 9,
    maxHeight: 280,
    backgroundColor: '#000',
  },
  videoTapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  videoTap: {
    aspectRatio: 16 / 9,
    maxHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E2E8F0',
  },
  videoTapText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    aspectRatio: 16 / 9,
    maxHeight: 100,
  },
  placeholderText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
});
