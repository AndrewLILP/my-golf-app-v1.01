import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getWeatherByLocation, getWeatherIconUrl, getWeatherColor } from '../services/weatherService';
import theme from '../styles/theme';
import colors from '../styles/colors';

export default function WeatherScreen() {
  const { location } = useLocalSearchParams();
  const router = useRouter();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [units, setUnits] = useState('imperial'); // 'imperial' for Fahrenheit

  useEffect(() => {
    if (location) {
      fetchWeather();
    }
  }, [location, units]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getWeatherByLocation(location, units);
      setWeather(data);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Unable to fetch weather data. Please check the location name and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeather();
  };

  const toggleUnits = () => {
    setUnits(units === 'imperial' ? 'metric' : 'imperial');
  };

  const handleSetGoals = () => {
    router.push({
      pathname: '/goals',
      params: { location }
    });
  };

  const getWeatherBackground = () => {
    if (!weather) return { backgroundColor: colors.background.main };
    
    const condition = weather.weather.main;
    const color = getWeatherColor(condition);
    
    return {
      backgroundColor: color + '15', // Add transparency
      borderColor: color + '30',
    };
  };

  const getTempUnit = () => units === 'imperial' ? '°F' : '°C';
  const getSpeedUnit = () => units === 'imperial' ? 'mph' : 'm/s';

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading weather for {location}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWeather}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {weather && (
        <>
          <View style={[styles.weatherCard, getWeatherBackground()]}>
            <View style={styles.locationContainer}>
              <Text style={styles.locationName}>{weather.location.name}</Text>
              <Text style={styles.locationCountry}>{weather.location.country}</Text>
            </View>
            
            <View style={styles.mainWeatherContainer}>
              <Image 
                source={{ uri: getWeatherIconUrl(weather.weather.icon) }}
                style={styles.weatherIcon}
              />
              
              <View style={styles.temperatureContainer}>
                <Text style={styles.temperature}>
                  {weather.temperature.current}
                  <Text style={styles.tempUnit}>{getTempUnit()}</Text>
                </Text>
                <Text style={styles.weatherDescription}>
                  {weather.weather.description}
                </Text>
              </View>
            </View>
            
            <View style={styles.feelsLikeContainer}>
              <Text style={styles.feelsLikeText}>
                Feels like {weather.temperature.feels_like}{getTempUnit()}
              </Text>
            </View>
            
            <View style={styles.minMaxContainer}>
              <Text style={styles.minMaxText}>
                H: {weather.temperature.max}{getTempUnit()} L: {weather.temperature.min}{getTempUnit()}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Weather Details</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>
                  {weather.details.wind_speed} {getSpeedUnit()}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{weather.details.humidity}%</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Visibility</Text>
                <Text style={styles.detailValue}>
                  {weather.details.visibility.toFixed(1)} km
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pressure</Text>
                <Text style={styles.detailValue}>
                  {weather.details.pressure} hPa
                </Text>
              </View>
            </View>
          </View>
          
          {weather.isFromCache && (
            <View style={styles.cacheWarning}>
              <Text style={styles.cacheWarningText}>
                ⚠️ Showing cached data. Pull down to refresh.
              </Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.unitToggleButton} 
              onPress={toggleUnits}
            >
              <Text style={styles.buttonText}>
                Switch to {units === 'imperial' ? 'Celsius' : 'Fahrenheit'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.goalsButton}
              onPress={handleSetGoals}
            >
              <Text style={styles.buttonText}>Set Round Goals</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.lastUpdatedContainer}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {new Date(weather.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  contentContainer: {
    padding: theme.spacing.md,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  retryButtonText: {
    color: colors.text.light,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
  },
  weatherCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: theme.shadowsIOS.medium,
      android: {
        elevation: theme.elevation.medium,
      },
    }),
  },
  locationContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  locationName: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  locationCountry: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
  },
  mainWeatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  weatherIcon: {
    width: 100,
    height: 100,
  },
  temperatureContainer: {
    alignItems: 'center',
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  tempUnit: {
    fontSize: 24,
    fontWeight: 'normal',
  },
  weatherDescription: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  feelsLikeContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  feelsLikeText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
  },
  minMaxContainer: {
    alignItems: 'center',
  },
  minMaxText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.text.secondary,
  },
  detailsCard: {
    backgroundColor: colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.shadowsIOS.small,
      android: {
        elevation: theme.elevation.small,
      },
    }),
  },
  detailsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500',
    color: colors.text.primary,
  },
  cacheWarning: {
    backgroundColor: colors.status.warning + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  cacheWarningText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
  },
  actionButtons: {
    marginBottom: theme.spacing.md,
  },
  unitToggleButton: {
    backgroundColor: colors.secondary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  goalsButton: {
    backgroundColor: colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text.light,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  lastUpdatedText: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.hint,
  },
});