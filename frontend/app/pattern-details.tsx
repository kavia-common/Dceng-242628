import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PatternDetailsScreen() {
  const { sessionId, speaker } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    loadPatternDetails();
  }, []);

  const loadPatternDetails = async () => {
    try {
      // Get session and messages
      const sessionResponse = await axios.get(`${BACKEND_URL}/api/session/${sessionId}`);
      setSession(sessionResponse.data);

      const messagesResponse = await axios.get(`${BACKEND_URL}/api/session/${sessionId}/messages`);
      const messages = messagesResponse.data.messages || [];

      // Filter patterns for the specific speaker
      const allPatterns: any[] = [];
      messages.forEach((msg: any) => {
        if (msg.speaker === speaker && msg.patterns) {
          msg.patterns.forEach((pattern: any) => {
            allPatterns.push({
              ...pattern,
              messageText: msg.text,
              timestamp: msg.timestamp,
            });
          });
        }
      });

      setPatterns(allPatterns);
    } catch (error) {
      console.error('Error loading pattern details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#64ffda';
      case 'tentative':
        return '#ffaa00';
      case 'exonerated':
        return '#888888';
      default:
        return '#ccd6f6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'tentative':
        return 'help-circle';
      case 'exonerated':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#64ffda" />
      </View>
    );
  }

  const speakerName = speaker === 'user' ? session?.userName : session?.otherName;
  const speakerColor = speaker === 'user' ? '#64ffda' : '#f07178';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#64ffda" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pattern Analysis Log</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary */}
      <View style={[styles.summary, { borderLeftColor: speakerColor }]}>
        <Text style={styles.summaryTitle}>{speakerName}'s Patterns</Text>
        <Text style={styles.summaryCount}>{patterns.length} total patterns detected</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#64ffda' }]}>
              {patterns.filter(p => p.status === 'confirmed').length}
            </Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#ffaa00' }]}>
              {patterns.filter(p => p.status === 'tentative').length}
            </Text>
            <Text style={styles.statLabel}>Tentative</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#888888' }]}>
              {patterns.filter(p => p.status === 'exonerated').length}
            </Text>
            <Text style={styles.statLabel}>Exonerated</Text>
          </View>
        </View>
      </View>

      {/* Patterns List */}
      <ScrollView style={styles.patternsList} contentContainerStyle={styles.patternsContent}>
        {patterns.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="happy-outline" size={48} color="#64ffda" />
            <Text style={styles.emptyText}>No patterns detected yet!</Text>
            <Text style={styles.emptySubtext}>Clean communication so far.</Text>
          </View>
        ) : (
          patterns.map((pattern, index) => (
            <View key={index} style={styles.patternCard}>
              {/* Header */}
              <View style={styles.patternHeader}>
                <View style={styles.patternTitleRow}>
                  <Ionicons
                    name={getStatusIcon(pattern.status) as any}
                    size={24}
                    color={getStatusColor(pattern.status)}
                  />
                  <Text style={[styles.patternTitle, { color: getStatusColor(pattern.status) }]}>
                    {pattern.type.replace(/_/g, ' ')}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{formatTimestamp(pattern.timestamp)}</Text>
              </View>

              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(pattern.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(pattern.status) }]}>
                  {pattern.status.toUpperCase()}
                </Text>
              </View>

              {/* Confidence Score */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Confidence:</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${(pattern.confidence || 0.5) * 100}%`,
                        backgroundColor: getStatusColor(pattern.status),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.infoValue}>{Math.round((pattern.confidence || 0.5) * 100)}%</Text>
              </View>

              {/* Evidence */}
              {pattern.evidence && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Evidence:</Text>
                  <Text style={styles.evidenceText}>"{pattern.evidence}"</Text>
                </View>
              )}

              {/* Message Context */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Message Context:</Text>
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>"{pattern.messageText}"</Text>
                </View>
              </View>

              {/* Reevaluation Reason */}
              {pattern.reevaluationReason && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>AI Analysis:</Text>
                  <Text style={styles.reasonText}>{pattern.reevaluationReason}</Text>
                </View>
              )}

              {/* Pattern ID (for debugging) */}
              <Text style={styles.patternId}>ID: {pattern.id}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e27',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1d2d50',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summary: {
    backgroundColor: '#112240',
    padding: 20,
    borderLeftWidth: 4,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 16,
    color: '#8892b0',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#8892b0',
    marginTop: 4,
  },
  patternsList: {
    flex: 1,
  },
  patternsContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ccd6f6',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8892b0',
    marginTop: 8,
  },
  patternCard: {
    backgroundColor: '#112240',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1d2d50',
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#8892b0',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8892b0',
    width: 80,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#1d2d50',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#ccd6f6',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#64ffda',
    fontWeight: '600',
    marginBottom: 6,
  },
  evidenceText: {
    fontSize: 14,
    color: '#f07178',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  messageBox: {
    backgroundColor: '#1d2d50',
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#ccd6f6',
    lineHeight: 20,
  },
  reasonText: {
    fontSize: 14,
    color: '#ccd6f6',
    lineHeight: 20,
  },
  patternId: {
    fontSize: 10,
    color: '#4a5568',
    marginTop: 12,
    fontFamily: 'monospace',
  },
});
