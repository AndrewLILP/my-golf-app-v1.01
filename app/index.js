import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const router = useRouter();

  // Load recent locations when component mounts
  useEffect(() => {
    const loadRecentLocations = async () => {
      try {
        const savedLocations = await AsyncStorage.getItem('recentLocations');
        if (savedLocations) {
          setRecentLocations(JSON.parse(savedLocations));
        }
      } catch (error) {
        console.error('Error loading recent locations:', error);
      }
    };

    loadRecentLocations();
  }, []);

  // Save location and navigate to weather screen
  const handleCheckWeather = async () => {
    if (!location.trim()) return;
    
    setIsLoading(true);

    try {
      // Save to recent locations
      const updatedLocations = [
        location,
        ...recentLocations.filter(loc => loc !== location)
      ].slice(0, 5); // Keep only the 5 most recent
      
      setRecentLocations(updatedLocations);
      await AsyncStorage.setItem('recentLocations', JSON.stringify(updatedLocations));
      
      // Navigate to weather screen with location
      router.push({
        pathname: '/weather',
        params: { location }
      });
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to goals screen
  const handleSetGoals = () => {
    router.push('/goals');
  };

  // Select a recent location
  const selectRecentLocation = (loc) => {
    setLocation(loc);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Golf Companion</Text>
          <Text style={styles.subtitle}>Check weather and set your round goals</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Golf Course Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter city or course name"
            value={location}
            onChangeText={setLocation}
          />
          
          {recentLocations.length > 0 && (
            <View style={styles.recentContainer}>
              <Text style={styles.recentTitle}>Recent Locations:</Text>
              {recentLocations.map((loc, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => selectRecentLocation(loc)}
                >
                  <Text style={styles.recentText}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.weatherButton}
            onPress={handleCheckWeather}
            disabled={isLoading || !location.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Check Weather</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.goalsButton}
            onPress={handleSetGoals}
          >
            <Text style={styles.buttonText}>Set Round Goals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/history')}
          >
            <Text style={styles.buttonText}>View History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#546e7a',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#37474f',
  },
  input: {
    height: 50,
    borderColor: '#b0bec5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  recentContainer: {
    marginTop: 15,
  },
  recentTitle: {
    fontSize: 14,
    color: '#546e7a',
    marginBottom: 5,
  },
  recentItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  recentText: {
    fontSize: 14,
    color: '#0288d1',
  },
  buttonContainer: {
    gap: 15,
  },
  weatherButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsButton: {
    backgroundColor: '#26a69a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    backgroundColor: '#546e7a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});