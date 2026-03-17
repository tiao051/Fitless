import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './src/context/AuthContext';
import { AuthService } from './src/services/authService';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen.tsx';
import RegisterScreen from './src/screens/auth/RegisterScreen.tsx';
import WelcomeScreen from './src/screens/auth/WelcomeScreen.tsx';
import OnboardingScreen from './src/screens/auth/OnboardingScreen.tsx';
import HomeScreen from './src/screens/home/HomeScreen.tsx';
import FoodSearchScreen from './src/screens/nutrition/FoodSearchScreen.tsx';
import LogNutritionScreen from './src/screens/nutrition/LogNutritionScreen.tsx';
import ProfileScreen from './src/screens/profile/ProfileScreen.tsx';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function LoggedInTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0E0E10',
        tabBarInactiveTintColor: '#8D8E94',
        tabBarStyle: {
          borderTopColor: '#E6E6EA',
          backgroundColor: '#F5F5F7',
        },
        headerStyle: {
          backgroundColor: '#F5F5F7',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: '#0E0E10',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Today',
          tabBarLabel: 'Today',
        }}
      />
      <Tab.Screen 
        name="LogNutrition" 
        component={LogNutritionScreen}
        options={{
          title: 'Add Meal',
          tabBarLabel: 'Add',
        }}
      />
      <Tab.Screen 
        name="FoodSearch" 
        component={FoodSearchScreen}
        options={{
          title: 'Foods',
          tabBarLabel: 'Foods',
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
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
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
