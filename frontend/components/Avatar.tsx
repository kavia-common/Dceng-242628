import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, Polygon } from 'react-native-svg';
import { useRouter } from 'expo-router';

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
  sessionId?: string;
  speaker?: string;
}

const Avatar: React.FC<AvatarProps> = ({ config, animations, confirmedPatterns = [], name, sessionId, speaker }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

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

        {/* CONFIRMED PATTERNS - Persistent tactical overlays */}
        {confirmedPatterns.map((pattern, idx) => renderAnimation(pattern.type, `confirmed-${idx}`, true))}

        {/* TEMPORARY FLASH - Animation overlays for new detections */}
        {animations.map((anim, idx) => renderAnimation(anim.type, `temp-${idx}`, false))}
      </Svg>
    );
  };

  const renderAnimation = (type: string, key: number, isConfirmed: boolean = false) => {
    const opacity = isConfirmed ? 0.9 : 0.6;
    const strokeWidth = isConfirmed ? 3 : 2;
    
    // Visual indicators for different patterns - now more prominent
    switch (type) {
      case 'blame_shifting':
        // Armor shield - LARGER and more visible
        return (
          <g key={key} opacity={opacity}>
            <Polygon
              points="15,40 15,90 50,105 85,90 85,40"
              fill="rgba(200,200,200,0.4)"
              stroke="#ffaa00"
              strokeWidth={strokeWidth}
            />
            {isConfirmed && (
              <>
                <Circle cx="50" cy="65" r="8" fill="#ffaa00" opacity="0.7" />
                <Path d="M45,65 L50,70 L55,65" stroke="#000" strokeWidth="2" fill="none" />
              </>
            )}
          </g>
        );
      case 'gaslighting':
        // Reality distortion - swirling vortex effect
        return (
          <g key={key} opacity={opacity}>
            <Circle
              cx="50"
              cy="60"
              r="35"
              fill="none"
              stroke="rgba(255,100,100,0.6)"
              strokeWidth={strokeWidth}
              strokeDasharray="10,5"
            />
            <Circle
              cx="50"
              cy="60"
              r="25"
              fill="none"
              stroke="rgba(255,100,100,0.5)"
              strokeWidth={strokeWidth}
              strokeDasharray="8,4"
            />
            {isConfirmed && (
              <Path
                d="M30,60 Q40,50 50,60 T70,60"
                stroke="#ff6464"
                strokeWidth="3"
                fill="none"
              />
            )}
          </g>
        );
      case 'stonewalling':
        // Brick wall
        return (
          <g key={key} opacity={opacity}>
            <Rect x="75" y="30" width="20" height="80" fill="rgba(100,100,100,0.7)" stroke="#666" strokeWidth={strokeWidth} />
            {isConfirmed && (
              <>
                <Rect x="77" y="32" width="7" height="12" fill="#888" />
                <Rect x="86" y="32" width="7" height="12" fill="#888" />
                <Rect x="77" y="46" width="7" height="12" fill="#888" />
                <Rect x="86" y="60" width="7" height="12" fill="#888" />
                <Rect x="77" y="74" width="7" height="12" fill="#888" />
              </>
            )}
          </g>
        );
      case 'deflection':
        // Mirror shield with reflection
        return (
          <g key={key} opacity={opacity}>
            <Ellipse
              cx="20"
              cy="60"
              rx="15"
              ry="30"
              fill="rgba(150,200,255,0.5)"
              stroke="#66ccff"
              strokeWidth={strokeWidth}
            />
            {isConfirmed && (
              <Path d="M15,50 L25,60 L15,70" stroke="#ffffff" strokeWidth="2" fill="none" />
            )}
          </g>
        );
      case 'healthy_boundary':
        // Clean shield - GREEN
        return (
          <g key={key} opacity={opacity}>
            <Ellipse
              cx="50"
              cy="70"
              rx="40"
              ry="45"
              fill="none"
              stroke="#00ff88"
              strokeWidth={strokeWidth + 1}
            />
            {isConfirmed && (
              <Path d="M35,70 L45,80 L65,60" stroke="#00ff88" strokeWidth="3" fill="none" />
            )}
          </g>
        );
      case 'weaponized_boundary':
        // Spiked shield - RED
        return (
          <g key={key} opacity={opacity}>
            <Ellipse
              cx="50"
              cy="70"
              rx="40"
              ry="45"
              fill="none"
              stroke="#ff0000"
              strokeWidth={strokeWidth + 1}
            />
            {/* Spikes */}
            <Polygon points="50,25 45,35 55,35" fill="#ff0000" />
            <Polygon points="85,55 75,50 75,60" fill="#ff0000" />
            <Polygon points="85,85 75,80 75,90" fill="#ff0000" />
            <Polygon points="15,55 25,50 25,60" fill="#ff0000" />
            <Polygon points="50,115 45,105 55,105" fill="#ff0000" />
          </g>
        );
      case 'guilt_tripping':
        // Heavy chains
        return (
          <g key={key} opacity={opacity}>
            <Path d="M30,85 L20,110" stroke="rgba(80,80,80,0.8)" strokeWidth={strokeWidth + 2} />
            <Path d="M40,85 L35,110" stroke="rgba(80,80,80,0.8)" strokeWidth={strokeWidth + 2} />
            <Path d="M60,85 L65,110" stroke="rgba(80,80,80,0.8)" strokeWidth={strokeWidth + 2} />
            <Path d="M70,85 L80,110" stroke="rgba(80,80,80,0.8)" strokeWidth={strokeWidth + 2} />
            {isConfirmed && (
              <>
                <Circle cx="20" cy="110" r="4" fill="#555" />
                <Circle cx="35" cy="110" r="4" fill="#555" />
                <Circle cx="65" cy="110" r="4" fill="#555" />
                <Circle cx="80" cy="110" r="4" fill="#555" />
              </>
            )}
          </g>
        );
      case 'passive_aggression':
        // Hidden daggers
        return (
          <g key={key} opacity={opacity}>
            <Polygon points="85,65 90,75 80,75" fill="rgba(180,0,0,0.7)" stroke="#900" strokeWidth={strokeWidth} />
            {isConfirmed && (
              <>
                <Polygon points="85,50 90,60 80,60" fill="rgba(180,0,0,0.7)" stroke="#900" strokeWidth={strokeWidth} />
                <Polygon points="85,80 90,90 80,90" fill="rgba(180,0,0,0.7)" stroke="#900" strokeWidth={strokeWidth} />
              </>
            )}
          </g>
        );
      case 'love_bombing':
        // Overwhelming hearts
        return (
          <g key={key} opacity={opacity}>
            <Path d="M40,30 Q35,25 30,30 Q25,35 30,40 L40,50 L50,40 Q55,35 50,30 Q45,25 40,30" fill="rgba(255,100,150,0.6)" stroke="#ff6496" strokeWidth={strokeWidth} />
            {isConfirmed && (
              <>
                <Path d="M60,35 Q57,32 54,35 Q51,38 54,41 L60,47 L66,41 Q69,38 66,35 Q63,32 60,35" fill="rgba(255,100,150,0.6)" stroke="#ff6496" strokeWidth={strokeWidth} />
                <Path d="M30,50 Q27,47 24,50 Q21,53 24,56 L30,62 L36,56 Q39,53 36,50 Q33,47 30,50" fill="rgba(255,100,150,0.6)" stroke="#ff6496" strokeWidth={strokeWidth} />
              </>
            )}
          </g>
        );
      case 'projection':
        // Shadow throwing
        return (
          <g key={key} opacity={opacity}>
            <Path
              d="M70,50 Q80,60 85,75 L90,90"
              stroke="rgba(50,50,100,0.7)"
              strokeWidth={strokeWidth + 1}
              fill="none"
            />
            {isConfirmed && (
              <Ellipse cx="90" cy="95" rx="8" ry="5" fill="rgba(0,0,0,0.5)" />
            )}
          </g>
        );
      case 'darvo':
        // Role reversal - flip symbol
        return (
          <g key={key} opacity={opacity}>
            <Path d="M30,40 L35,50 L30,60" stroke="#ff9900" strokeWidth={strokeWidth} fill="none" />
            <Path d="M35,50 L65,50" stroke="#ff9900" strokeWidth={strokeWidth} />
            <Path d="M70,40 L65,50 L70,60" stroke="#ff9900" strokeWidth={strokeWidth} fill="none" />
            {isConfirmed && (
              <Circle cx="50" cy="50" r="8" fill="none" stroke="#ff9900" strokeWidth={strokeWidth} />
            )}
          </g>
        );
      case 'triangulation':
        // Third person shadow
        return (
          <g key={key} opacity={opacity}>
            <Circle cx="85" cy="40" r="10" fill="rgba(100,100,150,0.5)" stroke="#6666aa" strokeWidth={strokeWidth} />
            <Rect x="78" y="50" width="14" height="20" fill="rgba(100,100,150,0.5)" stroke="#6666aa" strokeWidth={strokeWidth} />
            {isConfirmed && (
              <Path d="M75,55 L50,65" stroke="#6666aa" strokeWidth="2" strokeDasharray="3,3" />
            )}
          </g>
        );
      case 'moving_goalposts':
        // Shifting target
        return (
          <g key={key} opacity={opacity}>
            <Circle cx="80" cy="50" r="12" fill="none" stroke="#ffaa00" strokeWidth={strokeWidth} />
            <Circle cx="80" cy="50" r="6" fill="none" stroke="#ffaa00" strokeWidth={strokeWidth} />
            {isConfirmed && (
              <>
                <Path d="M80,50 L90,40" stroke="#ffaa00" strokeWidth="2" />
                <Polygon points="90,40 88,45 85,43" fill="#ffaa00" />
              </>
            )}
          </g>
        );
      case 'invalidation':
        // Erasing gesture
        return (
          <g key={key} opacity={opacity}>
            <Path d="M20,70 L35,55" stroke="rgba(200,50,50,0.7)" strokeWidth={strokeWidth + 1} />
            <Path d="M20,55 L35,70" stroke="rgba(200,50,50,0.7)" strokeWidth={strokeWidth + 1} />
            {isConfirmed && (
              <Circle cx="27.5" cy="62.5" r="15" fill="none" stroke="#c83232" strokeWidth={strokeWidth} />
            )}
          </g>
        );
      default:
        // Generic warning indicator
        return (
          <Circle
            key={key}
            cx="85"
            cy="30"
            r="6"
            fill="rgba(255,0,0,0.5)"
            stroke="#ff0000"
            strokeWidth={strokeWidth}
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
      
      {/* Pattern count badge - gamified and CLICKABLE */}
      {confirmedPatterns.length > 0 && sessionId && (
        <TouchableOpacity
          style={styles.patternCountBadge}
          onPress={() => router.push({
            pathname: '/pattern-details',
            params: { sessionId, speaker: speaker || 'user' }
          })}
        >
          <Text style={styles.patternCountText}>{confirmedPatterns.length}</Text>
          <Text style={styles.patternCountLabel}>patterns</Text>
        </TouchableOpacity>
      )}
      
      {/* Pattern indicators below avatar - temporary flash */}
      {animations.length > 0 && (
        <View style={styles.indicatorContainer}>
          {animations.map((anim, idx) => (
            <View key={idx} style={styles.indicator}>
              <Text style={styles.indicatorText}>
                +{anim.type.replace(/_/g, ' ')}
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
  patternCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  patternCountText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '900',
    textAlign: 'center',
  },
  patternCountLabel: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -2,
  },
});

export default Avatar;
