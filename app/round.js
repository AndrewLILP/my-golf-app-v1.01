import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeatherDisplay from '../components/WeatherDisplay';
import { getCurrentRoundGoals } from '../services/storageService';
import { getWeatherByLocation } from '../services/weatherService';
import theme from '../styles/theme';
import colors from '../styles/colors';

export default function RoundScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Get location from params or set default
  const location = params.location || '';
  
  // State variables
  const [roundGoals, setRoundGoals] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [notes, setNotes] = useState('');
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [roundNotes, setRoundNotes] = useState([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [roundRating, setRoundRating] = useState(3);
  const [goalAchieved, setGoalAchieved] = useState(false);
  
  // Load goals and weather
  useEffect(() => {
    const initialize = async () => {
      setLoadingGoals(true);
      setLoadingWeather(true);
      
      try {
        // Get current round goals
        const goals = await getCurrentRoundGoals();
        setRoundGoals(goals);
        
        // Get weather data
        if (location) {
          const weatherData = await getWeatherByLocation(location);
          setWeather(weatherData);
        }
        
        // Initialize round data or load existing
        const existingRoundData = await AsyncStorage.getItem('currentRound');
        
        if (existingRoundData) {
          const parsedData = JSON.parse(existingRoundData);
          
          if (parsedData.location === location) {
            // Load existing round data
            setNotes(parsedData.notes || '');
            setRoundStartTime(parsedData.startTime);
            setRoundNotes(parsedData.roundNotes || []);
          } else {
            // New location, new round
            initializeNewRound();
          }
        } else {
          // No existing round, initialize new one
          initializeNewRound();
        }
      } catch (error) {
        console.error('Error initializing round:', error);
      } finally {
        setLoadingGoals(false);
        setLoadingWeather(false);
      }
    };
    
    initialize();
  }, [location]);
  
  // Update elapsed time
  useEffect(() => {
    if (!roundStartTime) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const started = new Date(roundStartTime).getTime();
      setElapsedTime(Math.floor((now - started) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [roundStartTime]);
  
  // Initialize new round
  const initializeNewRound = async () => {
    const startTime = new Date().toISOString();
    setRoundStartTime(startTime);
    setNotes('');
    setRoundNotes([]);
    
    // Save initial round data
    await saveRoundData(startTime, '', []);
  };
  
  // Save round data
  const saveRoundData = async (startTime, notes, roundNotes) => {
    try {
      const roundData = {
        location,
        startTime,
        notes,
        roundNotes,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('currentRound', JSON.stringify(roundData));
    } catch (error) {
      console.error('Error saving round data:', error);
    }
  };
  
  // Handle adding a new note
  const handleAddNote = () => {
    setCurrentNote('');
    setShowNoteModal(true);
  };
  
  // Save a new note
  const saveNote = () => {
    if (!currentNote.trim()) {
      setShowNoteModal(false);
      return;
    }
    
    const newNote = {
      id: Date.now().toString(),
      text: currentNote.trim(),
      timestamp: new Date().toISOString(),
      elapsedTime
    };
    
    const updatedNotes = [...roundNotes, newNote];
    setRoundNotes(updatedNotes);
    setShowNoteModal(false);
    
    // Save updated round data
    saveRoundData(roundStartTime, notes, updatedNotes);
  };
  
  // Delete a note
  const deleteNote = (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          const updatedNotes = roundNotes.filter(note => note.id !== noteId);
          setRoundNotes(updatedNotes);
          
          // Save updated round data
          saveRoundData(roundStartTime, notes, updatedNotes);
        }}
      ]
    );
  };
  
  // Handle general notes change
  const handleNotesChange = (text) => {
    setNotes(text);
    
    // Save updated round data
    saveRoundData(roundStartTime, text, roundNotes);
  };
  
  // Complete the round
  const completeRound = () => {
    setShowCompletionModal(true);
  };
  
  // Save completed round
  const saveCompletedRound = async () => {
    try {
      // Get previous completed rounds
      const completedRoundsData = await AsyncStorage.getItem('completedRounds');
      const completedRounds = completedRoundsData ? JSON.parse(completedRoundsData) : [];
      
      // Create completed round object
      const completedRound = {
        id: Date.now().toString(),
        location,
        goals: roundGoals?.goals || 'No goals set',
        notes,
        roundNotes,
        startTime: roundStartTime,
        endTime: new Date().toISOString(),
        duration: elapsedTime,
        rating: roundRating,
        goalAchieved,
        weather: weather ? {
          condition: weather.weather.main,
          temperature: weather.temperature.current,
          units: weather.units
        } : null
      };
      
      // Add to completed rounds
      completedRounds.unshift(completedRound);
      
      // Save completed rounds
      await AsyncStorage.setItem('completedRounds', JSON.stringify(completedRounds));
      
      // Clear current round
      await AsyncStorage.removeItem('currentRound');
      
      // Navigate back to home
      router.replace('/');
    } catch (error) {
      console.error('Error saving completed round:', error);
      Alert.alert('Error', 'Failed to save round data.');
    }
  };
  
  // Format elapsed time
  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format note timestamp
  const formatNoteTime = (timestamp, seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m into round`;
    } else {
      return `${minutes}m into round`;
    }
  };

  // Loading screen
  if ((loadingGoals || loadingWeather) && (!roundGoals || !weather)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading round data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Location and Time */}
        <View style={styles.headerContainer}>
          <Text style={styles.locationText}>{location}</Text>
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>Round Time:</Text>
            <Text style={styles.timeValue}>{formatElapsedTime(elapsedTime)}</Text>
          </View>
        </View>
        
        {/* Weather */}
        {weather && (
          <View style={styles.weatherContainer}>
            <WeatherDisplay weatherData={weather} compact={true} />
          </View>
        )}
        
        {/* Goals */}
        {roundGoals && (
          <View style={styles.goalsContainer}>
            <Text style={styles.sectionTitle}>Round Goals</Text>
            <View style={styles.goalCard}>
              <Text style={styles.goalText}>{roundGoals.goals}</Text>
            </View>
          </View>
        )}
        
        {/* Quick Notes */}
        <View style={styles.quickNotesContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Round Notes</Text>
            <TouchableOpacity 
              style={styles.addNoteButton}
              onPress={handleAddNote}
            >
              <Text style={styles.addNoteButtonText}>+ Add Note</Text>
            </TouchableOpacity>
          </View>
          
          {roundNotes.length > 0 ? (
            <View style={styles.notesListContainer}>
              {roundNotes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTimestamp}>
                      {formatNoteTime(note.timestamp, note.elapsedTime)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteNote(note.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteNoteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.noteText}>{note.text}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noNotesText}>
              No notes yet. Tap "Add Note" to record thoughts during your round.
            </Text>
          )}
        </View>
        
        {/* General Notes */}
        <View style={styles.generalNotesContainer}>
          <Text style={styles.sectionTitle}>General Notes</Text>
          <TextInput
            style={styles.generalNotesInput}
            multiline
            placeholder="Add general notes about your round..."
            value={notes}
            onChangeText={handleNotesChange}
          />
        </View>
      </ScrollView>
      
      {/* Complete Round Button */}
      <View style={styles.completeButtonContainer}>
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={completeRound}
        >
          <Text style={styles.completeButtonText}>Complete Round</Text>
        </TouchableOpacity>
      </View>
      
      {/* Add Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Round Note</Text>
            <Text style={styles.modalSubtitle}>
              Time: {formatElapsedTime(elapsedTime)}
            </Text>
            
            <TextInput
              style={styles.noteInput}
              multiline
              placeholder="What's happening in your round?"
              value={currentNote}
              onChangeText={setCurrentNote}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={saveNote}
              >
                <Text style={styles.modalSaveButtonText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Complete Round Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.completionModalContent}>
            <Text style={styles.modalTitle}>Complete Round</Text>
            <Text style={styles.modalSubtitle}>
              Total Time: {formatElapsedTime(elapsedTime)}
            </Text>
            
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>How was your round?</Text>
              <View style={styles.ratingButtons}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      roundRating === rating && styles.selectedRatingButton
                    ]}
                    onPress={() => setRoundRating(rating)}
                  >
                    <Text style={[
                      styles.ratingButtonText,
                      roundRating === rating && styles.selectedRatingButtonText
                    ]}>
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingHint}>
                {roundRating === 1 ? 'Poor' : 
                 roundRating === 2 ? 'Fair' :
                 roundRating === 3 ? 'Good' :
                 roundRating === 4 ? 'Great' : 'Excellent'}
              </Text>
            </View>
            
            {roundGoals && (
              <View style={styles.goalAchievementContainer}>
                <Text style={styles.goalAchievementLabel}>Did you achieve your goals?</Text>
                <View style={styles.goalAchievementButtons}>
                  <TouchableOpacity
                    style={[
                      styles.goalButton,
                      goalAchieved === true && styles.selectedGoalButton
                    ]}
                    onPress={() => setGoalAchieved(true)}
                  >
                    <Text style={[
                      styles.goalButtonText,
                      goalAchieved === true && styles.selectedGoalButtonText
                    ]}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.goalButton,
                      goalAchieved === false && styles.selectedGoalButton
                    ]}
                    onPress={() => setGoalAchieved(false)}
                  >
                    <Text style={[
                      styles.goalButtonText,
                      goalAchieved === false && styles.selectedGoalButtonText
                    ]}>
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowCompletionModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={saveCompletedRound}
              >
                <Text style={styles.modalSaveButtonText}>Save & Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 100, // Extra padding for the complete button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  locationText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  timeContainer: {
    backgroundColor: colors.primary + '15',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  timeLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.secondary,
  },
  timeValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  weatherContainer: {
    marginBottom: theme.spacing.md,
  },
  goalsContainer: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  goalCard: {
    backgroundColor: colors.background.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  goalText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  quickNotesContainer: {
    marginBottom: theme.spacing.md,
  },
  addNoteButton: {
    backgroundColor: colors.secondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  addNoteButtonText: {
    color: colors.text.light,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  notesListContainer: {
    marginTop: theme.spacing.sm,
  },
  noteItem: {
    backgroundColor: colors.background.paper,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.shadowsIOS.small,
      android: {
        elevation: theme.elevation.small,
      },
    }),
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  noteTimestamp: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  deleteNoteText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.status.error,
  },
  noteText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  noNotesText: {
    textAlign: 'center',
    padding: theme.spacing.md,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  generalNotesContainer: {
    marginBottom: theme.spacing.xl,
  },
  generalNotesInput: {
    backgroundColor: colors.background.paper,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  completeButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: colors.background.main,
    borderTopWidth: 1,
    borderTopColor: colors.ui.divider,
  },
  completeButton: {
    backgroundColor: colors.status.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.text.light,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: theme.spacing.md,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.background.paper,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...Platform.select({
      ios: theme.shadowsIOS.large,
      android: {
        elevation: theme.elevation.large,
      },
    }),
  },
  completionModalContent: {
    width: '100%',
    backgroundColor: colors.background.paper,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...Platform.select({
      ios: theme.shadowsIOS.large,
      android: {
        elevation: theme.elevation.large,
      },
    }),
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.background.dark,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  modalCancelButtonText: {
    color: colors.text.secondary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  modalSaveButtonText: {
    color: colors.text.light,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
  },
  ratingContainer: {
    marginBottom: theme.spacing.lg,
  },
  ratingLabel: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  selectedRatingButton: {
    backgroundColor: colors.primary,
  },
  ratingButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
    fontWeight: 'bold',
  },
  selectedRatingButtonText: {
    color: colors.text.light,
  },
  ratingHint: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  goalAchievementContainer: {
    marginBottom: theme.spacing.lg,
  },
  goalAchievementLabel: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  goalAchievementButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  goalButton: {
    flex: 1,
    backgroundColor: colors.background.dark,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    maxWidth: 100,
  },
  selectedGoalButton: {
    backgroundColor: colors.primary,
  },
  goalButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  selectedGoalButtonText: {
    color: colors.text.light,
  },
});