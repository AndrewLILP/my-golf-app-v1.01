import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GoalInput from '../components/GoalInput';
import WeatherDisplay from '../components/WeatherDisplay';
import { 
  getCurrentRoundGoals, 
  getRoundGoalsHistory, 
  deleteGoalFromHistory 
} from '../services/storageService';
import { getWeatherByLocation } from '../services/weatherService';
import theme from '../styles/theme';
import colors from '../styles/colors';

export default function GoalsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Get location from params or set default
  const location = params.location || '';
  
  const [currentGoals, setCurrentGoals] = useState(null);
  const [previousGoals, setPreviousGoals] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load weather data
  useEffect(() => {
    const fetchWeather = async () => {
      if (!location) return;
      
      setLoadingWeather(true);
      try {
        const data = await getWeatherByLocation(location);
        setWeather(data);
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [location]);

  // Load goals history
  useEffect(() => {
    const loadGoals = async () => {
      setLoadingHistory(true);
      try {
        // Get current round goals
        const current = await getCurrentRoundGoals();
        setCurrentGoals(current);
        
        // Get previous goals
        const history = await getRoundGoalsHistory();
        
        // Filter out current goals from history if it exists
        const previous = current 
          ? history.filter(goal => goal.id !== current.id)
          : history;
          
        // Only show history for this location
        const locationHistory = location 
          ? previous.filter(goal => goal.location === location)
          : previous;
          
        setPreviousGoals(locationHistory);
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadGoals();
  }, [location]);

  // Handle saving goals
  const handleGoalSave = (savedGoals) => {
    setCurrentGoals(savedGoals);
    
    // Update previous goals
    getRoundGoalsHistory().then(history => {
      const previous = history.filter(goal => goal.id !== savedGoals.id);
      const locationHistory = location 
        ? previous.filter(goal => goal.location === location)
        : previous;
      setPreviousGoals(locationHistory);
    });
  };

  // Handle delete goal from history
  const handleDeleteGoal = (goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteGoalFromHistory(goalId);
            
            // Refresh goals
            const history = await getRoundGoalsHistory();
            const locationHistory = location 
              ? history.filter(goal => goal.location === location)
              : history;
            setPreviousGoals(locationHistory);
            
            // If current goal was deleted, clear it
            if (currentGoals && currentGoals.id === goalId) {
              setCurrentGoals(null);
            }
          } catch (error) {
            console.error('Error deleting goal:', error);
          }
        }}
      ]
    );
  };

  // Start round with current goals
  const handleStartRound = () => {
    if (currentGoals) {
      router.push({
        pathname: '/round',
        params: { location }
      });
    } else {
      Alert.alert(
        'No Goals Set',
        'Please set your goals for this round before starting.'
      );
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Location Header */}
        {location ? (
          <View style={styles.locationHeader}>
            <Text style={styles.locationText}>{location}</Text>
          </View>
        ) : (
          <View style={styles.locationHeader}>
            <Text style={styles.locationText}>Set Your Round Goals</Text>
          </View>
        )}

        {/* Weather Summary (if location is provided) */}
        {location && (
          <View style={styles.weatherContainer}>
            {loadingWeather ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading weather...</Text>
              </View>
            ) : weather ? (
              <WeatherDisplay weatherData={weather} compact={true} />
            ) : (
              <Text style={styles.noWeatherText}>No weather data available</Text>
            )}
          </View>
        )}

        {/* Goals Input */}
        <View style={styles.goalInputContainer}>
          <GoalInput 
            location={location} 
            onSave={handleGoalSave} 
          />
        </View>

        {/* Start Round Button */}
        <TouchableOpacity
          style={[
            styles.startRoundButton,
            (!currentGoals) && styles.disabledButton
          ]}
          onPress={handleStartRound}
          disabled={!currentGoals}
        >
          <Text style={styles.startRoundButtonText}>
            Start Round
          </Text>
        </TouchableOpacity>

        {/* Previous Goals */}
        {location && (
          <View style={styles.previousGoalsContainer}>
            <Text style={styles.sectionTitle}>Previous Goals at {location}</Text>
            
            {loadingHistory ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : previousGoals.length > 0 ? (
              <View>
                {previousGoals.map((goal) => (
                  <View key={goal.id} style={styles.goalHistoryItem}>
                    <View style={styles.goalHistoryHeader}>
                      <Text style={styles.goalHistoryDate}>
                        {formatDate(goal.date)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteGoal(goal.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.deleteGoalText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.goalHistoryContent}>{goal.goals}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noHistoryText}>
                No previous goals for this location
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  locationHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  locationText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  weatherContainer: {
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  noWeatherText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    padding: theme.spacing.md,
  },
  goalInputContainer: {
    marginBottom: theme.spacing.md,
  },
  startRoundButton: {
    backgroundColor: colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...Platform.select({
      ios: theme.shadowsIOS.medium,
      android: {
        elevation: theme.elevation.medium,
      },
    }),
  },
  startRoundButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.light,
  },
  disabledButton: {
    backgroundColor: colors.ui.placeholder,
  },
  previousGoalsContainer: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500',
    marginBottom: theme.spacing.md,
    color: colors.text.primary,
  },
  goalHistoryItem: {
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
  goalHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  goalHistoryDate: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  deleteGoalText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.status.error,
  },
  goalHistoryContent: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  noHistoryText: {
    textAlign: 'center',
    padding: theme.spacing.md,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});