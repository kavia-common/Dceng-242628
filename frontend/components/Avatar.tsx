import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, Polygon } from 'react-native-svg';

interface AvatarProps {
  config: {
    gender: string;
    skinTone: string;
    hairStyle: string;
    facialFeature: string;
  };
  animations: any[];
  confirmedPatterns?: any[];
  name: string;
}

const Avatar: React.FC<AvatarProps> = ({ config, animations, confirmedPatterns = [], name }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animations.length > 0) {
      // Trigger shake animation when patterns detected
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animations]);

  const getSkinColor = (tone: string) => {
    const colors: Record<string, string> = {
      light: '#ffd5b5',
      medium: '#f1c27d',
      tan: '#c68642',
      brown: '#8d5524',
      dark: '#5c3317',
    };
    return colors[tone] || colors.medium;
  };

  const getHairColor = () => '#2d2d2d';

  const renderAvatar = () => {
    const skinColor = getSkinColor(config.skinTone);
    const hairColor = getHairColor();

    return (
      <Svg width="100" height="120" viewBox="0 0 100 120">
        {/* Body - Simple T-shirt */}
        <Path
          d="M30,70 L30,110 L70,110 L70,70 L65,60 L55,65 L45,65 L35,60 Z"
          fill="#64ffda"
          stroke="#0a192f"
          strokeWidth="2"
        />

        {/* Neck */}
        <Rect x="42" y="55" width="16" height="15" fill={skinColor} />

        {/* Head */}
        <Circle cx="50" cy="40" r="22" fill={skinColor} stroke="#0a192f" strokeWidth="2" />

        {/* Hair based on style */}
        {config.hairStyle === 'short' && (
          <Path
            d="M28,35 Q28,18 50,18 Q72,18 72,35 L72,40 Q72,25 50,25 Q28,25 28,40 Z"
            fill={hairColor}
          />
        )}
        {config.hairStyle === 'long' && (
          <>
            <Path
              d="M28,35 Q28,18 50,18 Q72,18 72,35 L72,40 Q72,25 50,25 Q28,25 28,40 Z"
              fill={hairColor}
            />
            <Path
              d="M25,35 L20,70 L30,68 L28,40 Z"
              fill={hairColor}
            />
            <Path
              d="M75,35 L80,70 L70,68 L72,40 Z"
              fill={hairColor}
            />
          </>
        )}
        {config.hairStyle === 'bald' && null}

        {/* Eyes */}
        <Circle cx="40" cy="38" r="3" fill="#2d2d2d" />
        <Circle cx="60" cy="38" r="3" fill="#2d2d2d" />

        {/* Nose */}
        <Path d="M50,43 L48,48 L52,48 Z" fill={skinColor} stroke="#0a192f" strokeWidth="1" />

        {/* Mouth - neutral */}
        <Path d="M42,53 Q50,55 58,53" stroke="#2d2d2d" strokeWidth="2" fill="none" />

        {/* Animation overlays based on detected patterns */}
        {animations.map((anim, idx) => renderAnimation(anim.type, idx))}
      </Svg>
    );
  };

  const renderAnimation = (type: string, key: number) => {
    // Visual indicators for different patterns
    switch (type) {
      case 'blame_shifting':
        // Armor shield
        return (
          <Polygon
            key={key}
            points="20,50 20,80 50,100 80,80 80,50"
            fill="rgba(255,255,255,0.3)"
            stroke="#ffff00"
            strokeWidth="2"
          />
        );
      case 'gaslighting':
        // Distortion effect (spiral)
        return (
          <Circle
            key={key}
            cx="50"
            cy="60"
            r="40"
            fill="none"
            stroke="rgba(255,100,100,0.5)"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
        );
      case 'stonewalling':
        // Wall
        return (
          <Rect
            key={key}
            x="80"
            y="40"
            width="15"
            height="60"
            fill="rgba(150,150,150,0.7)"
            stroke="#888"
            strokeWidth="2"
          />
        );
      case 'healthy_boundary':
        // Clean shield
        return (
          <Ellipse
            key={key}
            cx="50"
            cy="70"
            rx="45"
            ry="50"
            fill="none"
            stroke="#00ff00"
            strokeWidth="3"
          />
        );
      case 'weaponized_boundary':
        // Spiked shield
        return (
          <>
            <Ellipse
              key={`${key}-shield`}
              cx="50"
              cy="70"
              rx="45"
              ry="50"
              fill="none"
              stroke="#ff0000"
              strokeWidth="3"
            />
            <Polygon
              key={`${key}-spike1`}
              points="50,20 45,30 55,30"
              fill="#ff0000"
            />
            <Polygon
              key={`${key}-spike2`}
              points="85,60 75,55 75,65"
              fill="#ff0000"
            />
          </>
        );
      case 'guilt_tripping':
        // Chains
        return (
          <Path
            key={key}
            d="M30,90 L20,110 M40,90 L35,110 M60,90 L65,110 M70,90 L80,110"
            stroke="rgba(100,100,100,0.7)"
            strokeWidth="4"
          />
        );
      case 'passive_aggression':
        // Hidden dagger
        return (
          <Polygon
            key={key}
            points="90,70 95,80 85,80"
            fill="rgba(200,0,0,0.6)"
            stroke="#800"
            strokeWidth="1"
          />
        );
      default:
        // Generic indicator
        return (
          <Circle
            key={key}
            cx="85"
            cy="30"
            r="8"
            fill="rgba(255,0,0,0.5)"
            stroke="#ff0000"
            strokeWidth="2"
          />
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: shakeAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {renderAvatar()}
      
      {/* Confirmed patterns - semi-permanent indicators */}
      {confirmedPatterns.length > 0 && (
        <View style={styles.confirmedContainer}>
          {confirmedPatterns.slice(-3).map((pattern, idx) => (
            <View key={idx} style={styles.confirmedBadge}>
              <Text style={styles.confirmedText}>
                {pattern.type.replace(/_/g, ' ').substring(0, 12)}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Pattern indicators below avatar - temporary flash */}
      {animations.length > 0 && (
        <View style={styles.indicatorContainer}>
          {animations.map((anim, idx) => (
            <View key={idx} style={styles.indicator}>
              <Text style={styles.indicatorText}>
                {anim.type.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  indicatorContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  indicator: {
    backgroundColor: 'rgba(240, 113, 120, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  indicatorText: {
    fontSize: 10,
    color: '#f07178',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  confirmedContainer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  confirmedBadge: {
    backgroundColor: '#64ffda30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#64ffda',
  },
  confirmedText: {
    fontSize: 9,
    color: '#64ffda',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

export default Avatar;
