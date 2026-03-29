import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  const features = [
    {
      icon: 'people',
      title: 'Dual Avatars',
      description: 'Customizable avatars representing both participants',
    },
    {
      icon: 'mic',
      title: 'Voice Input',
      description: 'Real-time voice recording and transcription',
    },
    {
      icon: 'eye',
      title: 'Pattern Detection',
      description: 'AI-powered analysis of communication dynamics',
    },
    {
      icon: 'flash',
      title: 'Visual Feedback',
      description: 'Animated representations of defense mechanisms',
    },
  ];

  const patterns = [
    'Blame Shifting',
    'Gaslighting',
    'Stonewalling',
    'Deflection',
    'Guilt Tripping',
    'Love Bombing',
    'Projection',
    'DARVO',
    'Moving Goalposts',
    'Triangulation',
    'Passive Aggression',
    'Invalidation',
    'Circular Reasoning',
    'Healthy Boundaries',
    'Weaponized Boundaries',
    'And more...',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>Discourse Engine</Text>
          <Text style={styles.tagline}>
            Visualize Conversation Patterns in Real-Time
          </Text>
          <Text style={styles.description}>
            A powerful tool to understand manipulative, toxic, and healthy
            communication patterns through visual representation and AI analysis.
          </Text>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/setup')}
          >
            <Text style={styles.ctaButtonText}>Start New Session</Text>
            <Ionicons name="arrow-forward" size={20} color="#0a192f" />
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={32} color="#64ffda" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detected Patterns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Patterns</Text>
          <Text style={styles.sectionSubtitle}>
            The engine can identify these communication tactics:
          </Text>
          <View style={styles.patternsContainer}>
            {patterns.map((pattern, index) => (
              <View key={index} style={styles.patternChip}>
                <Text style={styles.patternText}>{pattern}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Configure Avatars</Text>
                <Text style={styles.stepDescription}>
                  Set up customizable avatars for both participants
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Record Conversation</Text>
                <Text style={styles.stepDescription}>
                  Use voice input to capture real-time dialogue
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Analyze & Visualize</Text>
                <Text style={styles.stepDescription}>
                  AI detects patterns and displays visual feedback on avatars
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Gain Awareness</Text>
                <Text style={styles.stepDescription}>
                  Understand communication dynamics and promote healthier interactions
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer CTA */}
        <View style={styles.footerCta}>
          <Text style={styles.footerCtaTitle}>Ready to Start?</Text>
          <Text style={styles.footerCtaDescription}>
            Begin analyzing conversations and gaining insights into communication patterns
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/setup')}
          >
            <Text style={styles.ctaButtonText}>Launch Discourse Engine</Text>
            <Ionicons name="rocket" size={20} color="#0a192f" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  scrollContent: {
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 20,
    color: '#64ffda',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#8892b0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  ctaButton: {
    backgroundColor: '#64ffda',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#0a192f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#8892b0',
    marginBottom: 20,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#112240',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1d2d50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ccd6f6',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#8892b0',
    textAlign: 'center',
  },
  patternsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  patternChip: {
    backgroundColor: '#112240',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#64ffda40',
  },
  patternText: {
    color: '#64ffda',
    fontSize: 14,
    fontWeight: '500',
  },
  stepsContainer: {
    gap: 20,
  },
  step: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#64ffda',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#0a192f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ccd6f6',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8892b0',
    lineHeight: 20,
  },
  footerCta: {
    marginTop: 50,
    marginBottom: 30,
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#112240',
    borderRadius: 16,
  },
  footerCtaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  footerCtaDescription: {
    fontSize: 16,
    color: '#8892b0',
    textAlign: 'center',
    marginBottom: 24,
  },
});
