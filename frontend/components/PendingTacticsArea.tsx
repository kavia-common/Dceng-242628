import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface PendingPattern {
  id: string;
  type: string;
  speaker: string;
  status: 'tentative' | 'confirming' | 'exonerating';
}

interface PendingTacticsAreaProps {
  patterns: PendingPattern[];
  userColor?: string;
  otherColor?: string;
  onExonerated?: (patternId: string) => void;
}

const PendingTacticsArea: React.FC<PendingTacticsAreaProps> = ({ 
  patterns, 
  userColor = '#64ffda',
  otherColor = '#f07178',
  onExonerated 
}) => {
  if (patterns.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Analysis</Text>
      <View style={styles.patternsContainer}>
        {patterns.map((pattern) => (
          <PendingPattern
            key={pattern.id}
            pattern={pattern}
            color={pattern.speaker === 'user' ? userColor : otherColor}
            onExonerated={onExonerated}
          />
        ))}
      </View>
    </View>
  );
};

const PendingPattern: React.FC<{
  pattern: PendingPattern;
  color: string;
  onExonerated?: (patternId: string) => void;
}> = ({ pattern, color, onExonerated }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const smokeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (pattern.status === 'exonerating') {
      // Smoke poof animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(smokeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onExonerated) {
          onExonerated(pattern.id);
        }
      });
    } else if (pattern.status === 'confirming') {
      // Pulse animation while confirming
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [pattern.status]);

  const getSmokeOpacity = smokeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.patternCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: `${color}40`,
          borderColor: color,
        },
        pattern.status === 'exonerating' && styles.exoneratingCard,
      ]}
    >
      <View style={styles.patternContent}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.patternType, { color }]}>
          {pattern.type.replace(/_/g, ' ')}
        </Text>
      </View>

      {pattern.status === 'tentative' && (
        <Text style={[styles.statusText, { color }]}>Analyzing...</Text>
      )}

      {pattern.status === 'exonerating' && (
        <Animated.View style={[styles.smokeContainer, { opacity: getSmokeOpacity }]}>
          <Text style={styles.smokeText}>💨</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1d2d50',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64ffda',
    marginBottom: 12,
    textAlign: 'center',
  },
  patternsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  patternCard: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
  },
  exoneratingCard: {
    backgroundColor: '#64ffda20',
    borderColor: '#64ffda',
  },
  patternContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  patternType: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusText: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  smokeContainer: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -15,
  },
  smokeText: {
    fontSize: 30,
  },
});

export default PendingTacticsArea;
