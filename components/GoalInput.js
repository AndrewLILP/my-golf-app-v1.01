import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import theme from '../styles/theme';
import colors from '../styles/colors';
import { saveRoundGoals, getCurrentRoundGoals } from '../services/storageService';

const GoalInput = ({ location, onSave }) => {
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentGoals, setCurrentGoals] = useState(null);
  const [character, setCharacter] = useState(0);
  const maxChar = 500; // Maximum characters allowed

  useEffect(() => {
    // Load current goals when component mounts
    const loadCurrentGoals = async () => {
      try {
        const currentGoalData = await getCurrentRoundGoals();
        
        // Only set if it matches the current location
        if (currentGoalData && currentGoalData.location === location) {
          setCurrentGoals(currentGoalData);
          setGoals(currentGoalData.goals);
          setCharacter(currentGoalData.goals.length);
        }
      } catch (error) {
        console.error('Error loading current goals:', error);
      }
    };

    if (location) {
      loadCurrentGoals();
    }
  }, [location]);

  const handleSaveGoals = async () => {
    if (!goals.trim()) return;
    
    setLoading(true);
    
    try {
      const savedGoals = await saveRoundGoals(location, goals.trim());
      setCurrentGoals(savedGoals);
      
      if (onSave) {
        onSave(savedGoals);
      }
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text) => {
    if (text.length <= maxChar) {
      setGoals(text);
      setCharacter(text.length);
    }
  };

  const clearGoals = () => {
    setGoals('');
    setCharacter(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>What are your goals for this round?</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Enter your goals for today's round..."
          value={goals}
          onChangeText={handleTextChange}
          maxLength={maxChar}
        />
        
        <View style={styles.characterCounter}>
          <Text style={[
            styles.counterText,
            character > maxChar * 0.8 ? styles.warningText : null
          ]}>
            {character}/{maxChar}
          </Text>
        </View>
      </View>
      
      <View style={styles.suggestions}>
        <Text style={styles.suggestionsTitle}>Suggestions:</Text>
        <View style={styles.suggestionTags}>
          <TouchableOpacity 
            style={styles.suggestionTag}
            onPress={() => handleTextChange(goals + (goals ? '\n\n' : '') + 'Break 90 today')}
          >
            <Text style={styles.suggestionTagText}>Break 90</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.suggestionTag}
            onPress={() => handleTextChange(goals + (goals ? '\n\n' : '') + 'Focus on smooth tempo')}
          >
            <Text style={styles.suggestionTagText}>Smooth tempo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.suggestionTag}
            onPress={() => handleTextChange(goals + (goals ? '\n\n' : '') + 'Hit 8+ fairways')}
          >
            <Text style={styles.suggestionTagText}>Hit fairways</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.suggestionTag}
            onPress={() => handleTextChange(goals + (goals ? '\n\n' : '') + 'No 3-putts')}
          >
            <Text style={styles.suggestionTagText}>No 3-putts</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearGoals}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!goals.trim() || loading) && styles.disabledButton
          ]}
          onPress={handleSaveGoals}
          disabled={!goals.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Goals</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {currentGoals && currentGoals.goals === goals && (
        <View style={styles.savedNotice}>
          <Text style={styles.savedNoticeText}>
            ✓ Goals saved for {location}
          </Text>
          <Text style={styles.savedDateTime}>
            {new Date(currentGoals.date).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: colors.background.paper,
    fontSize: theme.typography.fontSize.md,
    color: colors.text.primary,
  },
  characterCounter: {
    position: 'absolute',
    bottom: 5,
    right: 10,
  },
  counterText: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.secondary,
  },
  warningText: {
    color: colors.status.warning,
  },
  suggestions: {
    marginBottom: theme.spacing.md,
  },
  suggestionsTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  suggestionTag: {
    backgroundColor: colors.secondary + '20',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  suggestionTagText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.secondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  clearButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.background.dark,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: theme.shadowsIOS.small,
      android: {
        elevation: theme.elevation.small,
      },
    }),
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.light,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: colors.primary + '80',
  },
  savedNotice: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: colors.status.success + '15',
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.success,
  },
  savedNoticeText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.status.success,
    fontWeight: '500',
  },
  savedDateTime: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default GoalInput;