import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { loginUser, registerUser, LoginCredentials, RegisterData } from '../../utils/apiService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: 'male',
    email: '',
    dob: '2025-06-11',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (isLogin) {
      if (!loginData.username.trim()) newErrors.username = 'Username is required';
      if (!loginData.password.trim()) newErrors.password = 'Password is required';
    } else {
      if (!registerData.username.trim()) newErrors.username = 'Username is required';
      if (!registerData.password.trim()) newErrors.password = 'Password is required';
      if (registerData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!registerData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!registerData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!registerData.email.trim()) newErrors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(registerData.email)) newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await loginUser(loginData);
      
      if (response.success) {
        Alert.alert('Success', 'Login successful!');
        // TODO: Navigate to main app
        // router.replace('/(tabs)');
      } else {
        Alert.alert('Error', response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await registerUser(registerData);
      
      if (response.success) {
        Alert.alert('Success', 'Registration successful! Please login.');
        setIsLogin(true);
        // Clear register form
        setRegisterData({
          username: '',
          password: '',
          firstName: '',
          lastName: '',
          gender: 'male',
          email: '',
          dob: '2025-06-11',
        });
      } else {
        Alert.alert('Error', response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoginForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>
        Don't use Winku Yet? <Text style={styles.link}>Take the tour</Text> or{' '}
        <Text style={styles.link} onPress={() => setIsLogin(false)}>Join now</Text>
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.username && styles.inputError]}
          placeholder="Username"
          value={loginData.username}
          onChangeText={(text) => setLoginData({ ...loginData, username: text })}
          autoCapitalize="none"
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          value={loginData.password}
          onChangeText={(text) => setLoginData({ ...loginData, password: text })}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.loginButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => setIsLogin(false)}>
          <Text style={styles.link}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRegisterForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Register</Text>
      <Text style={styles.subtitle}>
        Create your Winku account and start connecting with friends
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.username && styles.inputError]}
          placeholder="Username"
          value={registerData.username}
          onChangeText={(text) => setRegisterData({ ...registerData, username: text })}
          autoCapitalize="none"
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          value={registerData.password}
          onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            placeholder="First Name"
            value={registerData.firstName}
            onChangeText={(text) => setRegisterData({ ...registerData, firstName: text })}
          />
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>

        <View style={[styles.inputContainer, styles.halfWidth]}>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            placeholder="Last Name"
            value={registerData.lastName}
            onChangeText={(text) => setRegisterData({ ...registerData, lastName: text })}
          />
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>
      </View>

      <View style={styles.genderContainer}>
        <Text style={styles.genderLabel}>Gender:</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setRegisterData({ ...registerData, gender: 'male' })}
          >
            <View style={[styles.radio, registerData.gender === 'male' && styles.radioSelected]} />
            <Text style={styles.radioText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setRegisterData({ ...registerData, gender: 'female' })}
          >
            <View style={[styles.radio, registerData.gender === 'female' && styles.radioSelected]} />
            <Text style={styles.radioText}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          value={registerData.email}
          onChangeText={(text) => setRegisterData({ ...registerData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.registerButton]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => setIsLogin(true)}>
          <Text style={styles.link}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.gradient}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Winku</Text>
              <Text style={styles.brandSubtitle}>
                Connect with friends and share your moments
              </Text>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>😉</Text>
              </View>
            </View>
            
            <View style={styles.formSection}>
              {isLogin ? renderLoginForm() : renderRegisterForm()}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.05,
    paddingBottom: height * 0.03,
    paddingHorizontal: 20,
  },
  formSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logo: {
    fontSize: 50,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  link: {
    color: '#667eea',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#667eea',
  },
  registerButton: {
    backgroundColor: '#764ba2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  genderContainer: {
    marginBottom: 18,
  },
  genderLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 25,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
}); 