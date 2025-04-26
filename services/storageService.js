/**
 * Storage service for managing AsyncStorage operations
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Save round goals for a specific location
 * @param {string} location - Location/course name
 * @param {string} goals - User's goals for the round
 * @returns {Promise<void>}
 */
export const saveRoundGoals = async (location, goals) => {
  try {
    // Get all goals
    const allGoals = await getRoundGoalsHistory();
    
    // Create new goal entry
    const goalEntry = {
      id: Date.now().toString(),
      location,
      goals,
      date: new Date().toISOString(),
    };
    
    // Add to the beginning of the array
    allGoals.unshift(goalEntry);
    
    // Save back to storage
    await AsyncStorage.setItem('roundGoalsHistory', JSON.stringify(allGoals));
    
    // Also save as current round goals
    await AsyncStorage.setItem('currentRoundGoals', JSON.stringify(goalEntry));
    
    return goalEntry;
  } catch (error) {
    console.error('Error saving round goals:', error);
    throw error;
  }
};

/**
 * Get current round goals
 * @returns {Promise<Object|null>} Current round goals or null
 */
export const getCurrentRoundGoals = async () => {
  try {
    const data = await AsyncStorage.getItem('currentRoundGoals');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting current round goals:', error);
    return null;
  }
};

/**
 * Get history of all round goals
 * @returns {Promise<Array>} Array of goal entries
 */
export const getRoundGoalsHistory = async () => {
  try {
    const data = await AsyncStorage.getItem('roundGoalsHistory');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting round goals history:', error);
    return [];
  }
};

/**
 * Clear current round goals
 * @returns {Promise<void>}
 */
export const clearCurrentRoundGoals = async () => {
  try {
    await AsyncStorage.removeItem('currentRoundGoals');
  } catch (error) {
    console.error('Error clearing current round goals:', error);
    throw error;
  }
};

/**
 * Delete a specific goal from history
 * @param {string} goalId - ID of the goal to delete
 * @returns {Promise<void>}
 */
export const deleteGoalFromHistory = async (goalId) => {
  try {
    // Get all goals
    let allGoals = await getRoundGoalsHistory();
    
    // Filter out the one to delete
    allGoals = allGoals.filter(goal => goal.id !== goalId);
    
    // Save back to storage
    await AsyncStorage.setItem('roundGoalsHistory', JSON.stringify(allGoals));
    
    // If the current round goal was deleted, clear it
    const currentGoal = await getCurrentRoundGoals();
    if (currentGoal && currentGoal.id === goalId) {
      await clearCurrentRoundGoals();
    }
  } catch (error) {
    console.error('Error deleting goal from history:', error);
    throw error;
  }
};