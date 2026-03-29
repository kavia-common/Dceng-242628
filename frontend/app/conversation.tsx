import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import axios from 'axios';
import Constants from 'expo-constants';
import Avatar from '../components/Avatar';
import DefenseMechanismAnimation from '../components/DefenseMechanismAnimation';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ConversationScreen() {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'other'>('user');
  const [userAnimations, setUserAnimations] = useState<any[]>([]);
  const [otherAnimations, setOtherAnimations] = useState<any[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadSession();
    requestAudioPermission();
  }, []);

  const requestAudioPermission = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Audio recording permission is needed for voice input');
      }
    } catch (error) {
      console.error('Error requesting audio permission:', error);
    }
  };

  const loadSession = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/session/${sessionId}`);
      setSession(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading session:', error);
      Alert.alert('Error', 'Failed to load session');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        await transcribeAndAnalyze(uri);
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const transcribeAndAnalyze = async (audioUri: string) => {
    setIsTranscribing(true);
    
    try {
      // Transcribe audio
      const formData = new FormData();
      const audioBlob = {
        uri: audioUri,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any;
      formData.append('file', audioBlob);

      const transcribeResponse = await axios.post(
        `${BACKEND_URL}/api/transcribe`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const text = transcribeResponse.data.text;
      await analyzeAndAddMessage(text);

    } catch (error) {
      console.error('Error transcribing/analyzing:', error);
      Alert.alert('Error', 'Failed to process audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const analyzeAndAddMessage = async (text: string) => {
    try {
      // Analyze message for patterns
      const analyzeResponse = await axios.post(`${BACKEND_URL}/api/analyze`, {
        sessionId,
        speaker: currentSpeaker,
        text,
      });

      const patterns = analyzeResponse.data.patterns || [];

      // Add message to local state
      const newMessage = {
        speaker: currentSpeaker,
        text,
        timestamp: new Date().toISOString(),
        patterns,
      };

      setMessages(prev => [...prev, newMessage]);

      // Trigger animations for detected patterns
      if (patterns.length > 0) {
        if (currentSpeaker === 'user') {
          setUserAnimations(prev => [...prev, ...patterns]);
          setTimeout(() => {
            setUserAnimations(prev => prev.slice(patterns.length));
          }, 3000);
        } else {
          setOtherAnimations(prev => [...prev, ...patterns]);
          setTimeout(() => {
            setOtherAnimations(prev => prev.slice(patterns.length));
          }, 3000);
        }
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error analyzing message:', error);
      throw error;
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      Alert.alert('Empty Message', 'Please enter a message');
      return;
    }

    setIsProcessing(true);
    
    try {
      await analyzeAndAddMessage(textInput.trim());
      setTextInput('');
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to process message');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSpeaker = () => {
    setCurrentSpeaker(prev => prev === 'user' ? 'other' : 'user');
  };

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#64ffda" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#64ffda" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discourse Engine</Text>
          <View style={{ width: 24 }} />
        </View>

      {/* Avatars */}
      <View style={styles.avatarsContainer}>
        <View style={styles.avatarSection}>
          <Avatar
            config={session.userAvatar}
            animations={userAnimations}
            name={session.userName}
          />
          <Text style={styles.avatarName}>{session.userName}</Text>
        </View>

        <View style={styles.vsIndicator}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.avatarSection}>
          <Avatar
            config={session.otherAvatar}
            animations={otherAnimations}
            name={session.otherName}
          />
          <Text style={styles.avatarName}>{session.otherName}</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageCard,
              msg.speaker === 'user' ? styles.userMessage : styles.otherMessage,
            ]}
          >
            <Text style={styles.messageSpeaker}>
              {msg.speaker === 'user' ? session.userName : session.otherName}
            </Text>
            <Text style={styles.messageText}>{msg.text}</Text>
            
            {msg.patterns && msg.patterns.length > 0 && (
              <View style={styles.patternsContainer}>
                {msg.patterns.map((pattern: any, idx: number) => (
                  <View key={idx} style={styles.patternTag}>
                    <Text style={styles.patternText}>
                      {pattern.type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Recording Status */}
      {isTranscribing && (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color="#64ffda" />
          <Text style={styles.statusText}>Processing audio...</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.speakerToggle}
          onPress={toggleSpeaker}
        >
          <Text style={styles.speakerText}>
            Speaking: {currentSpeaker === 'user' ? session.userName : session.otherName}
          </Text>
        </TouchableOpacity>

        {/* Input Mode Toggle */}
        <View style={styles.inputModeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, inputMode === 'voice' && styles.modeButtonActive]}
            onPress={() => setInputMode('voice')}
          >
            <Ionicons 
              name="mic" 
              size={20} 
              color={inputMode === 'voice' ? '#0a192f' : '#64ffda'} 
            />
            <Text style={[styles.modeButtonText, inputMode === 'voice' && styles.modeButtonTextActive]}>
              Voice
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, inputMode === 'text' && styles.modeButtonActive]}
            onPress={() => setInputMode('text')}
          >
            <Ionicons 
              name="text" 
              size={20} 
              color={inputMode === 'text' ? '#0a192f' : '#64ffda'} 
            />
            <Text style={[styles.modeButtonText, inputMode === 'text' && styles.modeButtonTextActive]}>
              Text
            </Text>
          </TouchableOpacity>
        </View>

        {/* Voice Input */}
        {inputMode === 'voice' && (
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
          >
            {isRecording ? (
              <>
                <View style={styles.recordingDot} />
                <Text style={styles.recordButtonText}>Stop Recording</Text>
              </>
            ) : (
              <>
                <Ionicons name="mic" size={24} color="#0a192f" />
                <Text style={styles.recordButtonText}>Press to Speak</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Text Input */}
        {inputMode === 'text' && (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type your message..."
              placeholderTextColor="#8892b0"
              multiline
              maxLength={500}
              editable={!isProcessing}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!textInput.trim() || isProcessing) && styles.sendButtonDisabled]}
              onPress={handleTextSubmit}
              disabled={!textInput.trim() || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#0a192f" />
              ) : (
                <Ionicons name="send" size={24} color="#0a192f" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  flex: {
    flex: 1,
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
  avatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#112240',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#ccd6f6',
  },
  vsIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#64ffda',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a192f',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#112240',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  userMessage: {
    borderLeftColor: '#64ffda',
  },
  otherMessage: {
    borderLeftColor: '#f07178',
  },
  messageSpeaker: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64ffda',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#ccd6f6',
    lineHeight: 24,
  },
  patternsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  patternTag: {
    backgroundColor: '#f0717840',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  patternText: {
    fontSize: 12,
    color: '#f07178',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#1d2d50',
    gap: 8,
  },
  statusText: {
    color: '#64ffda',
    fontSize: 14,
  },
  controls: {
    padding: 16,
    backgroundColor: '#112240',
  },
  speakerToggle: {
    backgroundColor: '#1d2d50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  speakerText: {
    color: '#ccd6f6',
    fontSize: 14,
    fontWeight: '600',
  },
  recordButton: {
    backgroundColor: '#64ffda',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordingButton: {
    backgroundColor: '#f07178',
  },
  recordButtonText: {
    color: '#0a192f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  inputModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1d2d50',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#64ffda',
  },
  modeButtonText: {
    color: '#64ffda',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#0a192f',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1d2d50',
    borderRadius: 12,
    padding: 14,
    paddingTop: 14,
    color: '#ccd6f6',
    fontSize: 16,
    maxHeight: 120,
    minHeight: 48,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#64ffda',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
