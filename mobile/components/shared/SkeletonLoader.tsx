import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

export const RoundCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <SkeletonLoader width="70%" height={20} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="50%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="90%" height={14} style={{ marginBottom: 4 }} />
          <SkeletonLoader width="80%" height={14} />
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
          <SkeletonLoader width={60} height={32} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={50} height={16} />
        </View>
      </View>
    </View>
  );
};

export const StatsCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="40%" height={20} style={{ marginBottom: 16 }} />
      <View style={styles.statsRow}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <SkeletonLoader width={40} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={50} height={32} />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <SkeletonLoader width={40} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={50} height={32} />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <SkeletonLoader width={40} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={50} height={32} />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <SkeletonLoader width={40} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={50} height={32} />
        </View>
      </View>
    </View>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 24 }}>
        <SkeletonLoader width="60%" height={28} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="40%" height={20} />
      </View>
      <SkeletonLoader width="100%" height={48} style={{ marginBottom: 16, borderRadius: 8 }} />
      <StatsCardSkeleton />
      <View style={{ marginTop: 16 }}>
        <View style={styles.card}>
          <SkeletonLoader width="40%" height={20} style={{ marginBottom: 16 }} />
          <RoundCardSkeleton />
          <View style={{ marginTop: 12 }}>
            <RoundCardSkeleton />
          </View>
          <View style={{ marginTop: 12 }}>
            <RoundCardSkeleton />
          </View>
        </View>
      </View>
    </View>
  );
};

export const RoundsListSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <RoundCardSkeleton />
      <View style={{ marginTop: 12 }}>
        <RoundCardSkeleton />
      </View>
      <View style={{ marginTop: 12 }}>
        <RoundCardSkeleton />
      </View>
      <View style={{ marginTop: 12 }}>
        <RoundCardSkeleton />
      </View>
      <View style={{ marginTop: 12 }}>
        <RoundCardSkeleton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
