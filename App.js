import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "./src/screens/HomeScreen";
import WatchlistScreen from "./src/screens/WatchlistScreen";
import BrowserScreen from "./src/screens/BrowserScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import PlatformSettingsScreen from "./src/screens/PlatformSettingsScreen";
import { BrandColors } from './src/constants/Colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Settings Stack Navigator
function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: BrandColors.gradientStart,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen 
        name="PlatformSettings" 
        component={PlatformSettingsScreen}
        options={{ title: "Platform Settings" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={BrandColors.gradientStart} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "shield" : "shield-outline";
            } else if (route.name === "Watchlist") {
              iconName = focused ? "list" : "list-outline";
            } else if (route.name === "Browser") {
              iconName = focused ? "globe" : "globe-outline";
            } else if (route.name === "Settings") {
              iconName = focused ? "settings" : "settings-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: BrandColors.primary,
          tabBarInactiveTintColor: BrandColors.textMuted,
          tabBarStyle: {
            backgroundColor: BrandColors.background,
            borderTopColor: BrandColors.border,
          },
          headerShown: false, // Hide tab navigator headers since we use stack headers
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ 
            title: "🛡️ Spoiler Shield",
            headerShown: true,
            headerStyle: {
              backgroundColor: BrandColors.gradientStart,
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Tab.Screen
          name="Watchlist"
          component={WatchlistScreen}
          options={{ 
            title: "Watchlist",
            headerShown: true,
            headerStyle: {
              backgroundColor: BrandColors.gradientStart,
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Tab.Screen
          name="Browser"
          component={BrowserScreen}
          options={{ 
            title: "Protected Browse",
            headerShown: true,
            headerStyle: {
              backgroundColor: BrandColors.gradientStart,
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{ title: "Settings" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}