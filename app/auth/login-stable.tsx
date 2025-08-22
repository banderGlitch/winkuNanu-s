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
  ScrollView,
  Dimensions,
} from 'react-native';
import { loginUser, registerUser } from '../../utils/apiService';

const { height } = Dimensions.get('window');

export default function LoginScreenStable() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gender: 'male',
    email: '',
    dob: '2025-06-11',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength helper functions
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthColor = (password: string, level: number) => {
    const strength = getPasswordStrength(password);
    if (level <= strength) {
      if (strength <= 1) return { backgroundColor: '#ff6b6b' };
      if (strength <= 2) return { backgroundColor: '#ffa726' };
      if (strength <= 3) return { backgroundColor: '#ffd54f' };
      return { backgroundColor: '#66bb6a' };
    }
    return { backgroundColor: '#e0e0e0' };
  };

  const getPasswordStrengthTextColor = (password: string) => {
    const strength = getPasswordStrength(password);
    if (strength <= 1) return '#ff6b6b';
    if (strength <= 2) return '#ffa726';
    if (strength <= 3) return '#ffd54f';
    return '#66bb6a';
  };

  const getPasswordStrengthText = (password: string) => {
    const strength = getPasswordStrength(password);
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    return 'Strong';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (isLogin) {
      if (!loginData.username.trim()) newErrors.username = 'Username is required';
      if (!loginData.password.trim()) newErrors.password = 'Password is required';
    } else {
      if (!registerData.username.trim()) newErrors.username = 'Username is required';
      if (!registerData.password.trim()) newErrors.password = 'Password is required';
      if (registerData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (registerData.password !== registerData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
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
        setRegisterData({
          username: '',
          password: '',
          confirmPassword: '',
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
      <View style={styles.formHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <View style={[styles.titleBadge, { backgroundColor: '#4caf50' }]}>
            <Text style={styles.titleBadgeText}>👋</Text>
          </View>
        </View>
        <Text style={styles.formSubtitle}>Sign in to continue your journey</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.username && styles.inputError]}
          placeholder="Username"
          value={loginData.username}
          onChangeText={(text) => setLoginData(prev => ({ ...prev, username: text }))}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          value={loginData.password}
          onChangeText={(text) => setLoginData(prev => ({ ...prev, password: text }))}
          secureTextEntry={!showPassword}
          autoCorrect={false}
          spellCheck={false}
        />
        <TouchableOpacity 
          style={styles.passwordToggle}
          onPress={() => setShowPassword(prev => !prev)}
        >
          <Text>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.loginButton, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
          <Text style={styles.buttonSubtext}>Welcome back!</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setIsLogin(false)} style={styles.switchButton}>
        <Text style={styles.switchText}>Don't have an account? Create one</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.formTitle}>Join Winku</Text>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>✨ New</Text>
          </View>
        </View>
        <Text style={styles.formSubtitle}>Create your account and start connecting</Text>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Object.keys(registerData).filter(key => registerData[key as keyof typeof registerData] && registerData[key as keyof typeof registerData] !== '').length * 16.67)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.min(6, Object.keys(registerData).filter(key => registerData[key as keyof typeof registerData] && registerData[key as keyof typeof registerData] !== '').length)}/6 completed
          </Text>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.username && styles.inputError]}
          placeholder="Username"
          value={registerData.username}
          onChangeText={(text) => setRegisterData(prev => ({ ...prev, username: text }))}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            placeholder="First Name"
            value={registerData.firstName}
            onChangeText={(text) => setRegisterData(prev => ({ ...prev, firstName: text }))}
            autoCapitalize="words"
            autoCorrect={false}
            spellCheck={false}
          />
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>
        <View style={styles.halfWidth}>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            placeholder="Last Name"
            value={registerData.lastName}
            onChangeText={(text) => setRegisterData(prev => ({ ...prev, lastName: text }))}
            autoCapitalize="words"
            autoCorrect={false}
            spellCheck={false}
          />
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          value={registerData.email}
          onChangeText={(text) => setRegisterData(prev => ({ ...prev, email: text }))}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* Password Strength Indicator */}
      <View style={styles.passwordSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Password"
            value={registerData.password}
            onChangeText={(text) => setRegisterData(prev => ({ ...prev, password: text }))}
            secureTextEntry={!showPassword}
            autoCorrect={false}
            spellCheck={false}
          />
          <TouchableOpacity 
            style={styles.passwordToggle}
            onPress={() => setShowPassword(prev => !prev)}
          >
            <Text>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>
        {registerData.password.length > 0 && (
          <View style={styles.passwordStrength}>
            <Text style={styles.strengthLabel}>Password strength:</Text>
            <View style={styles.strengthBars}>
              {[1, 2, 3, 4].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.strengthBar,
                    getPasswordStrengthColor(registerData.password, level)
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.strengthText, { color: getPasswordStrengthTextColor(registerData.password) }]}>
              {getPasswordStrengthText(registerData.password)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Confirm Password"
          value={registerData.confirmPassword}
          onChangeText={(text) => setRegisterData(prev => ({ ...prev, confirmPassword: text }))}
          secureTextEntry={!showConfirmPassword}
          autoCorrect={false}
          spellCheck={false}
        />
        <TouchableOpacity 
          style={styles.passwordToggle}
          onPress={() => setShowConfirmPassword(prev => !prev)}
        >
          <Text>{showConfirmPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      {/* Enhanced Gender Selection */}
      <View style={styles.genderContainer}>
        <Text style={styles.genderLabel}>Gender</Text>
        <View style={styles.genderOptions}>
          <TouchableOpacity
            style={[
              styles.genderOption,
              registerData.gender === 'male' && styles.genderOptionSelected
            ]}
            onPress={() => setRegisterData(prev => ({ ...prev, gender: 'male' }))}
            activeOpacity={0.7}
          >
            <Text style={styles.genderIcon}>👨</Text>
            <Text style={[
              styles.genderOptionText,
              registerData.gender === 'male' && styles.genderOptionTextSelected
            ]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderOption,
              registerData.gender === 'female' && styles.genderOptionSelected
            ]}
            onPress={() => setRegisterData(prev => ({ ...prev, gender: 'female' }))}
            activeOpacity={0.7}
          >
            <Text style={styles.genderIcon}>👩</Text>
            <Text style={[
              styles.genderOptionText,
              registerData.gender === 'female' && styles.genderOptionTextSelected
            ]}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Terms and Conditions */}
      <View style={styles.termsContainer}>
        <TouchableOpacity style={styles.termsCheckbox}>
          <View style={[styles.checkbox, styles.checkboxChecked]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.registerButton, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Text>
          <Text style={styles.buttonSubtext}>Join the community</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setIsLogin(true)} style={styles.switchButton}>
        <Text style={styles.switchText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.background}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            nestedScrollEnabled={true}
          >
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Winku</Text>
              <Text style={styles.brandSubtitle}>Connect • Share • Inspire</Text>
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
  background: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: height * 0.04,
    paddingHorizontal: 20,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  brandSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  formContainer: {
    width: '100%',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  titleBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  titleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#f7fafc',
  },
  inputError: {
    borderColor: '#fc8181',
    backgroundColor: '#fed7d7',
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#667eea',
  },
  registerButton: {
    backgroundColor: '#764ba2',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '400',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  passwordSection: {
    marginBottom: 20,
  },
  passwordStrength: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 6,
    fontWeight: '500',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  genderContainer: {
    marginBottom: 20,
  },
  genderLabel: {
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 12,
    fontWeight: '600',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 15,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea',
  },
  genderIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  genderOptionText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '600',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  termsCheckbox: {
    marginRight: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
    flex: 1,
  },
  termsLink: {
    color: '#667eea',
    fontWeight: '600',
  },
}); 