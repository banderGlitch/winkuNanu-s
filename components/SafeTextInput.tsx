import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface SafeTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  placeholder?: string;
  style?: any;
  containerStyle?: any;
}

export default function SafeTextInput({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  showPasswordToggle = false,
  onTogglePassword,
  placeholder,
  style,
  containerStyle,
}: SafeTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleTogglePassword = useCallback(() => {
    if (onTogglePassword) {
      onTogglePassword();
    }
  }, [onTogglePassword]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputContainer, error && styles.inputError, style]}>
        <Text style={[
          styles.label,
          (value || error || isFocused) && styles.labelActive
        ]}>
          {label}
        </Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoCorrect={false}
          spellCheck={false}
          blurOnSubmit={false}
          returnKeyType="next"
          textContentType="none"
          autoComplete="off"
          importantForAccessibility="no"
          contextMenuHidden={false}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={handleTogglePassword} style={styles.passwordToggle}>
            <Text style={styles.passwordToggleText}>
              {secureTextEntry ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#f7fafc',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 25,
  },
  inputError: {
    borderColor: '#fc8181',
    backgroundColor: '#fed7d7',
  },
  label: {
    position: 'absolute',
    left: 20,
    top: 20,
    fontSize: 16,
    color: '#a0aec0',
    fontWeight: '500',
  },
  labelActive: {
    top: 8,
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  textInput: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 20,
    padding: 5,
  },
  passwordToggleText: {
    fontSize: 18,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 5,
    fontWeight: '500',
  },
}); 