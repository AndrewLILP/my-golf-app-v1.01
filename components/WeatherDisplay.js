import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { getWeatherIconUrl, getWeatherColor } from '../services/weatherService';
import theme from '../styles/theme';
import colors from '../styles/colors';

/**
 * A reusable component to display weather information
 * Can be used in multiple screens with consistent styling
 */
const WeatherDisplay = ({ weatherData, compact = false }) => {
  if (!weatherData) {
    return null;
  }

  const getTempUnit = () => weatherData.units === 'imperial' ? '°F' : '°C';
  const getSpeedUnit = () => weatherData.units === 'imperial' ? 'mph' : 'm/s';

  const getWeatherBackground = () => {
    const condition = weatherData.weather.main;
    const color = getWeatherColor(condition);
    
    return {
      backgroundColor: color + '15', // Add transparency
      borderColor: color + '30',
    };
  };

  // Compact version for use in other screens (e.g. goals, round)
  if (compact) {
    return (
      <View style={[styles.compactContainer, getWeatherBackground()]}>
        <View style={styles.compactRow}>
          <Image 
            source={{ uri: getWeatherIconUrl(weatherData.weather.icon, '2x') }}
            style={styles.compactIcon}
          />
          <View style={styles.compactInfo}>
            <Text style={styles.compactLocation}>{weatherData.location.name}</Text>
            <Text style={styles.compactTemp}>
              {weatherData.temperature.current}{getTempUnit()}, {weatherData.weather.description}
            </Text>
          </View>
        </View>
        <View style={styles.compactDetails}>
          <Text style={styles.compactDetailsText}>
            Wind: {weatherData.details.wind_speed} {getSpeedUnit()} | 
            Humidity: {weatherData.details.humidity}%
          </Text>
        </View>
      </View>
    );
  }

  // Full display version
  return (
    <View style={[styles.container, getWeatherBackground()]}>
      <View style={styles.locationContainer}>
        <Text style={styles.locationName}>{weatherData.location.name}</Text>
        <Text style={styles.locationCountry}>{weatherData.location.country}</Text>
      </View>
      
      <View style={styles.mainWeatherContainer}>
        <Image 
          source={{ uri: getWeatherIconUrl(weatherData.weather.icon) }}
          style={styles.weatherIcon}
        />
        
        <View style={styles.temperatureContainer}>
          <Text style={styles.temperature}>
            {weatherData.temperature.current}
            <Text style={styles.tempUnit}>{getTempUnit()}</Text>
          </Text>
          <Text style={styles.weatherDescription}>
            {weatherData.weather.description}
          </Text>
        </View>
      </View>
      
      <View style={styles.feelsLikeContainer}>
        <Text style={styles.feelsLikeText}>
          Feels like {weatherData.temperature.feels_like}{getTempUnit()}
        </Text>
      </View>
      
      <View style={styles.minMaxContainer}>
        <Text style={styles.minMaxText}>
          H: {weatherData.temperature.max}{getTempUnit()} L: {weatherData.temperature.min}{getTempUnit()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  
  // Styles for compact version
  compactContainer: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: theme.shadowsIOS.small,
      android: {
        elevation: theme.elevation.small,
      },
    }),
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    width: 50,
    height: 50,
  },
  compactInfo: {
    marginLeft: theme.spacing.sm,
  },
  compactLocation: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  compactTemp: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
  },
  compactDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.ui.divider + '50',
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  compactDetailsText: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.secondary,
  },
});

export default WeatherDisplay;