import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../styles/theme';
import colors from '../styles/colors';

export default function HistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [showRoundModal, setShowRoundModal] = useState(false);

  useEffect(() => {
    loadRoundHistory();
  }, []);

  const loadRoundHistory = async () => {
    try {
      setLoading(true);
      const completedRoundsData = await AsyncStorage.getItem('completedRounds');
      
      if (completedRoundsData) {
        const parsedRounds = JSON.parse(completedRoundsData);
        setRounds(parsedRounds);
      } else {
        setRounds([]);
      }
    } catch (error) {
      console.error('Error loading round history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoundSelect = (round) => {
    setSelectedRound(round);
    setShowRoundModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getWeatherEmoji = (condition) => {
    const weatherEmojis = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
    };

    return weatherEmojis[condition] || '🌤️';
  };

  const renderRoundItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.roundCard}
      onPress={() => handleRoundSelect(item)}
    >
      <View style={styles.roundHeader}>
        <Text style={styles.roundLocation}>{item.location}</Text>
        <Text style={styles.roundDate}>{formatDate(item.startTime)}</Text>
      </View>
      
      <View style={styles.roundDetails}>
        {item.weather && (
          <View style={styles.weatherChip}>
            <Text>
              {getWeatherEmoji(item.weather.condition)} {item.weather.temperature}
              {item.weather.units === 'imperial' ? '°F' : '°C'}
            </Text>
          </View>
        )}
        
        <View style={styles.durationChip}>
          <Text>⏱ {formatDuration(item.duration)}</Text>
        </View>
        
        <View style={[
          styles.ratingChip, 
          { backgroundColor: getRatingColor(item.rating) }
        ]}>
          <Text style={styles.ratingText}>
            {item.rating}/5
          </Text>
        </View>
        
        {item.goalAchieved !== undefined && (
          <View style={[
            styles.goalChip,
            { backgroundColor: item.goalAchieved ? colors.status.success + '30' : colors.status.warning + '30' }
          ]}>
            <Text style={{ 
              color: item.goalAchieved ? colors.status.success : colors.status.warning,
              fontWeight: '500'
            }}>
              {item.goalAchieved ? 'Goal Achieved' : 'Goal Not Met'}
            </Text>
          </View>
        )}
      </View>
      
      {item.notes && (
        <Text style={styles.notePreview} numberOfLines={1}>
          {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  const getRatingColor = (rating) => {
    const ratingColors = {
      1: '#ffcdd2', // Light red
      2: '#ffecb3', // Light amber
      3: '#e6ee9c', // Light lime
      4: '#c8e6c9', // Light green
      5: '#b2dfdb', // Light teal
    };
    
    return ratingColors[rating] || '#e0e0e0';
  };

  const renderRoundDetails = () => {
    if (!selectedRound) return null;
    
    return (
      <ScrollView style={styles.modalScrollView}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalLocation}>{selectedRound.location}</Text>
          <Text style={styles.modalDate}>{formatDate(selectedRound.startTime)}</Text>
        </View>
        
        {/* Round Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(selectedRound.startTime)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(selectedRound.startTime)}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{formatDuration(selectedRound.duration)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>{selectedRound.rating}/5</Text>
            </View>
          </View>
          
          {selectedRound.weather && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Weather</Text>
                <Text style={styles.infoValue}>
                  {getWeatherEmoji(selectedRound.weather.condition)} {selectedRound.weather.condition}, {selectedRound.weather.temperature}
                  {selectedRound.weather.units === 'imperial' ? '°F' : '°C'}
                </Text>
              </View>
              {selectedRound.goalAchieved !== undefined && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Goal</Text>
                  <Text style={[
                    styles.infoValue,
                    { color: selectedRound.goalAchieved ? colors.status.success : colors.status.warning }
                  ]}>
                    {selectedRound.goalAchieved ? 'Achieved' : 'Not Met'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* Goals */}
        {selectedRound.goals && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Round Goals</Text>
            <View style={styles.goalCard}>
              <Text style={styles.goalText}>{selectedRound.goals}</Text>
            </View>
          </View>
        )}
        
        {/* Notes */}
        {selectedRound.roundNotes && selectedRound.roundNotes.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Round Notes</Text>
            {selectedRound.roundNotes.map((note) => (
              <View key={note.id} style={styles.noteItem}>
                <Text style={styles.noteTime}>
                  {formatDuration(note.elapsedTime)} into round
                </Text>
                <Text style={styles.noteText}>{note.text}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* General Notes */}
        {selectedRound.notes && selectedRound.notes.trim() !== '' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>General Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{selectedRound.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Round History</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading round history...</Text>
        </View>
      ) : rounds.length > 0 ? (
        <FlatList
          data={rounds}
          renderItem={renderRoundItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No round history yet.</Text>
          <Text style={styles.emptySubtext}>Complete a round to see it here!</Text>
          
          <TouchableOpacity
            style={styles.newRoundButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.newRoundButtonText}>Start a New Round</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Round Detail Modal */}
      <Modal
        visible={showRoundModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowRoundModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowRoundModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          
          {renderRoundDetails()}
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
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.divider,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  roundCard: {
    backgroundColor: colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.shadowsIOS.small,
      android: {
        elevation: theme.elevation.small,
      },
    }),
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  roundLocation: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  roundDate: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
  },
  roundDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  weatherChip: {
    backgroundColor: colors.background.dark,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  durationChip: {
    backgroundColor: colors.background.dark,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  ratingChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  ratingText: {
    fontWeight: '500',
  },
  goalChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  notePreview: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  newRoundButton: {
    backgroundColor: colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  newRoundButtonText: {
    color: colors.text.light,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.main,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  closeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  modalScrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  modalHeader: {
    marginBottom: theme.spacing.md,
  },
  modalLocation: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  modalDate: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
  },
  infoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.shadowsIOS.small,
      android: {
        elevation: theme.elevation.small,
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: colors.text.primary,
  },
  sectionContainer: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500',
    color: colors.text.primary,
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
  noteItem: {
    backgroundColor: colors.background.paper,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...Platform.select({
      ios: theme.shadowsIOS.small,
      android: {
        elevation: theme.elevation.small,
      },
    }),
  },
  noteTime: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  noteText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
  },
  notesCard: {
    backgroundColor: colors.background.paper,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  notesText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
});