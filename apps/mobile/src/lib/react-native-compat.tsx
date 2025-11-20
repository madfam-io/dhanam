/**
 * React Native & Expo Compatibility Layer for React 19
 *
 * This file provides type-compatible exports of React Native and Expo components
 * that work with React 19. All components are cast to React.FC<any> to bypass
 * JSX type errors (TS2786).
 */

import React from 'react';
import * as RN from 'react-native';
import * as RNPaper from 'react-native-paper';
import { Stack as ExpoStack, Tabs as ExpoTabs, Redirect as ExpoRedirect } from 'expo-router';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  SafeAreaView as RNSafeAreaView,
  SafeAreaProvider as RNSafeAreaProvider,
} from 'react-native-safe-area-context';

// ============================================================================
// React Native Core Components
// ============================================================================
export const View = RN.View as any;
export const ScrollView = RN.ScrollView as any;
export const TouchableOpacity = RN.TouchableOpacity as any;
export const RefreshControl = RN.RefreshControl as any;

// React Native components with potential naming conflicts
// (prefixed with RN to distinguish from Paper versions)
export const RNText = RN.Text as any;
export const RNActivityIndicator = RN.ActivityIndicator as any;

// ============================================================================
// Expo Router Components
// ============================================================================
const _Stack: any = ExpoStack;
export const Stack = Object.assign(_Stack, { Screen: (_Stack as any).Screen });

const _Tabs: any = ExpoTabs;
export const Tabs = Object.assign(_Tabs, { Screen: (_Tabs as any).Screen });

export const Redirect = ExpoRedirect as any;

// ============================================================================
// Expo Linear Gradient
// ============================================================================
export const LinearGradient = ExpoLinearGradient as any;

// ============================================================================
// Expo Vector Icons
// ============================================================================
export const Ionicons = ExpoIonicons as any;

// ============================================================================
// Expo Status Bar
// ============================================================================
export const StatusBar = ExpoStatusBar as any;

// ============================================================================
// React Native Safe Area Context
// ============================================================================
export const SafeAreaView = RNSafeAreaView as any;
export const SafeAreaProvider = RNSafeAreaProvider as any;

// ============================================================================
// React Native Paper Components
// ============================================================================
// Paper components (most have unique names, no conflicts)
export const PaperText = RNPaper.Text as any;
export const Button = RNPaper.Button as any;
export const Checkbox = RNPaper.Checkbox as any;
export const HelperText = RNPaper.HelperText as any;
export const Chip = RNPaper.Chip as any;
export const PaperProvider = RNPaper.Provider as any;
export const FAB = RNPaper.FAB as any;
export const SegmentedButtons = RNPaper.SegmentedButtons as any;
export const Searchbar = RNPaper.Searchbar as any;
export const ProgressBar = RNPaper.ProgressBar as any;

// Paper components with potential naming conflicts (prefixed with Paper)
export const PaperSwitch = RNPaper.Switch as any;
export const PaperActivityIndicator = RNPaper.ActivityIndicator as any;

// Paper compound components (need to preserve namespaces)
const _TextInput: any = RNPaper.TextInput;
export const TextInput = Object.assign(_TextInput, { Icon: _TextInput.Icon });

const _Card: any = RNPaper.Card;
export const Card = Object.assign(_Card, { Content: _Card.Content });

const _List: any = RNPaper.List;
export const List = Object.assign(_List, { Item: _List.Item });

// ============================================================================
// Non-JSX exports (utilities, hooks, objects) - no type casting needed
// ============================================================================
export { StyleSheet, Platform, Dimensions, Alert, useColorScheme } from 'react-native';
export { router, useRouter, useSegments } from 'expo-router';
