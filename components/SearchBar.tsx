import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ 
  value, 
  onChangeText, 
  placeholder = "Search...",
  onClear,
  autoFocus = false 
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}>
          <Ionicons name="search" size={20} color="#94a3b8" />
        </View>
        
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          autoFocus={autoFocus}
          returnKeyType="search"
          clearButtonMode="never"
        />
        
        {value.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
}); 