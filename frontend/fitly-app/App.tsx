import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './src/context/AuthContext';
import { AuthService } from './src/services/authService';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import FoodSearchScreen from './src/screens/nutrition/FoodSearchScreen';
import LogNutritionScreen from './src/screens/nutrition/LogNutritionScreen';
import DailyNutritionScreen from './src/screens/nutrition/DailyNutritionScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function LoggedInTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="FoodSearch" 
        component={FoodSearchScreen}
        options={{
          title: 'Search Foods',
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen 
        name="LogNutrition" 
        component={LogNutritionScreen}
        options={{
          title: 'Log Meal',
          tabBarLabel: 'Log',
        }}
      />
      <Tab.Screen 
        name="DailySummary" 
        component={DailyNutritionScreen}
        options={{
          title: 'Today',
          tabBarLabel: 'Summary',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [state, dispatch] = React.useReducer(
    (prevState: any, action: any) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      try {
        token = await AsyncStorage.getItem('userToken');
      } catch (e) {
        // Restoring token failed
      }

      dispatch({ type: 'RESTORE_TOKEN', token });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (email: string, password: string) => {
        try {
          const response = await AuthService.login(email, password);
          dispatch({ type: 'SIGN_IN', token: response.token });
          await AsyncStorage.setItem('userToken', response.token);
          await AsyncStorage.setItem('userId', response.user.id.toString());
        } catch (e) {
          throw e;
        }
      },
      signUp: async (email: string, password: string, firstName: string, lastName: string) => {
        try {
          const response = await AuthService.register(email, password, firstName, lastName);
          dispatch({ type: 'SIGN_IN', token: response.token });
          await AsyncStorage.setItem('userToken', response.token);
          await AsyncStorage.setItem('userId', response.user.id.toString());
        } catch (e) {
          throw e;
        }
      },
      signOut: async () => {
        dispatch({ type: 'SIGN_OUT' });
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userId');
      },
    }),
    []
  );

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {state.userToken == null ? (
            <Stack.Group screenOptions={{ animationEnabled: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Group>
          ) : (
            <Stack.Screen name="Root" component={LoggedInTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
