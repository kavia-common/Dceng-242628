import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SetupScreen() {
  const router = useRouter();
  
  const [userAvatar, setUserAvatar] = useState({
    gender: 'male',
    skinTone: 'medium',
    hairStyle: 'short',
    facialFeature: 'neutral'
  });
  
  const [otherAvatar, setOtherAvatar] = useState({
    gender: 'female',
    skinTone: 'medium',
    hairStyle: 'long',
    facialFeature: 'neutral'
  });
  
  const [userName, setUserName] = useState('You');
  const [otherName, setOtherName] = useState('Other Person');

  const genders = ['male', 'female', 'non-binary'];
  const skinTones = ['light', 'medium', 'tan', 'brown', 'dark'];
  const hairStyles = ['short', 'medium', 'long', 'bald', 'curly'];

  const createSession = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/session/create`, {
        userAvatar,
        otherAvatar,
        userName,
        otherName
      });
      
      if (response.data.sessionId) {
        router.push({
          pathname: '/conversation',
          params: { sessionId: response.data.sessionId }
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const OptionButton = ({ label, selected, onPress }: any) => (
    <TouchableOpacity
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Discourse Engine</Text>
        <Text style={styles.subtitle}>
          Visualize conversation patterns and communication dynamics
        </Text>

        {/* User Avatar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Avatar</Text>
          
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionsRow}>
            {genders.map(g => (
              <OptionButton
                key={g}
                label={g}
                selected={userAvatar.gender === g}
                onPress={() => setUserAvatar({ ...userAvatar, gender: g })}
              />
            ))}
          </View>

          <Text style={styles.label}>Skin Tone</Text>
          <View style={styles.optionsRow}>
            {skinTones.map(s => (
              <OptionButton
                key={s}
                label={s}
                selected={userAvatar.skinTone === s}
                onPress={() => setUserAvatar({ ...userAvatar, skinTone: s })}
              />
            ))}
          </View>

          <Text style={styles.label}>Hair Style</Text>
          <View style={styles.optionsRow}>
            {hairStyles.map(h => (
              <OptionButton
                key={h}
                label={h}
                selected={userAvatar.hairStyle === h}
                onPress={() => setUserAvatar({ ...userAvatar, hairStyle: h })}
              />
            ))}
          </View>
        </View>

        {/* Other Person Avatar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Person's Avatar</Text>
          
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionsRow}>
            {genders.map(g => (
              <OptionButton
                key={g}
                label={g}
                selected={otherAvatar.gender === g}
                onPress={() => setOtherAvatar({ ...otherAvatar, gender: g })}
              />
            ))}
          </View>

          <Text style={styles.label}>Skin Tone</Text>
          <View style={styles.optionsRow}>
            {skinTones.map(s => (
              <OptionButton
                key={s}
                label={s}
                selected={otherAvatar.skinTone === s}
                onPress={() => setOtherAvatar({ ...otherAvatar, skinTone: s })}
              />
            ))}
          </View>

          <Text style={styles.label}>Hair Style</Text>
          <View style={styles.optionsRow}>
            {hairStyles.map(h => (
              <OptionButton
                key={h}
                label={h}
                selected={otherAvatar.hairStyle === h}
                onPress={() => setOtherAvatar({ ...otherAvatar, hairStyle: h })}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={createSession}>
          <Text style={styles.startButtonText}>Start Conversation</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#8892b0',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#112240',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#64ffda',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#ccd6f6',
    marginTop: 15,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1d2d50',
    borderWidth: 2,
    borderColor: '#1d2d50',
  },
  optionButtonSelected: {
    backgroundColor: '#64ffda20',
    borderColor: '#64ffda',
  },
  optionText: {
    color: '#8892b0',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#64ffda',
  },
  startButton: {
    backgroundColor: '#64ffda',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  startButtonText: {
    color: '#0a192f',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
