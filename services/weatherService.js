/**
 * Weather service for OpenWeather API integration
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace this with your actual API key
const API_KEY = 'e9d8228c699fb8e7794c173770e9a8f6';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Get weather data for a specific location
 * @param {string} location - City name or location
 * @param {string} units - Units of measurement ('metric', 'imperial')
 * @returns {Promise<Object>} Weather data
 */
export const getWeatherByLocation = async (location, units = 'imperial') => {
  try {
    // Check if we have cached data first
    const cachedData = await getCachedWeather(location, units);
    if (cachedData) {
      return cachedData;
    }

    // If no cached data, make API request
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: location,
        units: units,
        appid: API_KEY,
      },
    });

    if (response.status === 200) {
      const weatherData = response.data;
      
      // Format the data
      const formattedData = {
        location: {
          name: weatherData.name,
          country: weatherData.sys.country,
        },
        weather: {
          main: weatherData.weather[0].main,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
        },
        temperature: {
          current: Math.round(weatherData.main.temp),
          feels_like: Math.round(weatherData.main.feels_like),
          min: Math.round(weatherData.main.temp_min),
          max: Math.round(weatherData.main.temp_max),
        },
        details: {
          humidity: weatherData.main.humidity,
          pressure: weatherData.main.pressure,
          wind_speed: weatherData.wind.speed,
          wind_direction: weatherData.wind.deg,
          visibility: weatherData.visibility / 1000, // Convert to km
        },
        timestamp: new Date().getTime(),
        units: units,
      };

      // Cache the formatted data
      await cacheWeatherData(location, units, formattedData);
      
      return formattedData;
    }
    
    throw new Error('Unable to fetch weather data');
  } catch (error) {
    console.error('Weather API Error:', error);
    // Try to get cached data even if it's expired as fallback
    const expiredCache = await getCachedWeather(location, units, true);
    if (expiredCache) {
      return {
        ...expiredCache,
        isFromCache: true,
      };
    }
    throw error;
  }
};

/**
 * Get cached weather data if available and not expired
 * @param {string} location - City name or location
 * @param {string} units - Units of measurement
 * @param {boolean} ignoreExpiry - Whether to ignore cache expiry
 * @returns {Promise<Object|null>} Cached weather data or null
 */
const getCachedWeather = async (location, units, ignoreExpiry = false) => {
  try {
    const cacheKey = `weather_${location.toLowerCase()}_${units}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const now = new Date().getTime();
      
      // Check if cache is still valid (less than CACHE_DURATION old)
      if (ignoreExpiry || now - parsedData.timestamp < CACHE_DURATION) {
        return parsedData;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
};

/**
 * Cache weather data for a location
 * @param {string} location - City name or location
 * @param {string} units - Units of measurement
 * @param {Object} data - Weather data to cache
 */
const cacheWeatherData = async (location, units, data) => {
  try {
    const cacheKey = `weather_${location.toLowerCase()}_${units}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Cache storage error:', error);
  }
};

/**
 * Get weather icon URL
 * @param {string} iconCode - OpenWeather icon code
 * @param {number} size - Size of icon (1x, 2x, 4x)
 * @returns {string} Icon URL
 */
export const getWeatherIconUrl = (iconCode, size = '2x') => {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
};

/**
 * Get appropriate weather color based on condition
 * @param {string} condition - Weather condition
 * @returns {string} Color code
 */
export const getWeatherColor = (condition) => {
  const conditions = {
    'Clear': '#ffb300',      // Sunny
    'Clouds': '#78909c',     // Cloudy
    'Rain': '#0277bd',       // Rain
    'Drizzle': '#0288d1',    // Light rain
    'Thunderstorm': '#455a64', // Stormy
    'Snow': '#b0bec5',       // Snow
    'Mist': '#b0bec5',       // Mist
    'Fog': '#b0bec5',        // Fog
    'Haze': '#90a4ae',       // Haze
  };
  
  return conditions[condition] || '#78909c'; // Default to cloudy if not found
};