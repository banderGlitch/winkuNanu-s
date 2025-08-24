import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { loginUser, registerUser, LoginCredentials, RegisterData } from '../../utils/apiService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import KeyboardSafeView from '../../components/ui/KeyboardSafeView';
import SafeTextInput from '../../components/ui/SafeTextInput';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Animation values - use useRef to prevent recreation on re-renders
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  
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

  // Start animations on mount - simplified to prevent keyboard interference
  useEffect(() => {
    // Set form opacity immediately to prevent keyboard interference
    formOpacity.setValue(1);
  }, []);

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

    // Using SafeTextInput component instead of custom FloatingLabelInput

  const renderLoginForm = React.useCallback(() => (
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
      
      <SafeTextInput
        label="Username"
        value={loginData.username}
        onChangeText={(text: string) => setLoginData(prev => ({ ...prev, username: text }))}
        error={errors.username}
      />

      <SafeTextInput
        label="Password"
        value={loginData.password}
        onChangeText={(text: string) => setLoginData(prev => ({ ...prev, password: text }))}
        error={errors.password}
        secureTextEntry={!showPassword}
        showPasswordToggle={true}
        onTogglePassword={() => setShowPassword(prev => !prev)}
      />

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

             <TouchableOpacity
         style={[styles.actionButton, styles.loginButton, isLoading && styles.buttonDisabled]}
         onPress={handleLogin}
         disabled={isLoading}
         activeOpacity={0.8}
       >
         {isLoading ? (
           <LoadingSpinner size="small" color="#fff" />
         ) : (
           <View style={styles.buttonContent}>
             <Text style={styles.actionButtonText}>Sign In</Text>
             <Text style={styles.buttonSubtext}>Welcome back!</Text>
           </View>
         )}
       </TouchableOpacity>
       
               {/* Temporary button to test feeds */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#764ba2', marginTop: 15 }]}
          onPress={() => router.push('/feeds')}
          activeOpacity={0.8}
        >
         <View style={styles.buttonContent}>
           <Text style={styles.actionButtonText}>Test Feeds</Text>
           <Text style={styles.buttonSubtext}>Go to feeds page</Text>
         </View>
       </TouchableOpacity>
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => setIsLogin(false)} activeOpacity={0.7}>
          <Text style={styles.switchLink}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [loginData, errors, showPassword, isLoading]);

  const renderRegisterForm = React.useCallback(() => (
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
      
      <SafeTextInput
        label="Username"
        value={registerData.username}
        onChangeText={(text: string) => setRegisterData(prev => ({ ...prev, username: text }))}
        error={errors.username}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <SafeTextInput
            label="First Name"
            value={registerData.firstName}
            onChangeText={(text: string) => setRegisterData(prev => ({ ...prev, firstName: text }))}
            error={errors.firstName}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.halfWidth}>
          <SafeTextInput
            label="Last Name"
            value={registerData.lastName}
            onChangeText={(text: string) => setRegisterData(prev => ({ ...prev, lastName: text }))}
            error={errors.lastName}
            autoCapitalize="words"
          />
        </View>
      </View>

      <SafeTextInput
        label="Email"
        value={registerData.email}
        onChangeText={(text: string) => setRegisterData(prev => ({ ...prev, email: text }))}
        error={errors.email}
        keyboardType="email-address"
      />

      {/* Password Strength Indicator */}
      <View style={styles.passwordSection}>
        <SafeTextInput
          label="Password"
          value={registerData.password}
          onChangeText={(text: string) => setRegisterData(prev => ({ ...prev, password: text }))}
          error={errors.password}
          secureTextEntry={!showPassword}
          showPasswordToggle={true}
          onTogglePassword={() => setShowPassword(prev => !prev)}
        />
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

      <SafeTextInput
        label="Confirm Password"
        value={registerData.confirmPassword}
        onChangeText={(text: string) => setRegisterData(prev => ({ ...prev, confirmPassword: text }))}
        error={errors.confirmPassword}
        secureTextEntry={!showConfirmPassword}
        showPasswordToggle={true}
        onTogglePassword={() => setShowConfirmPassword(prev => !prev)}
      />

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
        style={[styles.actionButton, styles.registerButton, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <LoadingSpinner size="small" color="#fff" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.actionButtonText}>Create Account</Text>
            <Text style={styles.buttonSubtext}>Join the community</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => setIsLogin(true)} activeOpacity={0.7}>
          <Text style={styles.switchLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [registerData, errors, showPassword, showConfirmPassword, isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <KeyboardSafeView
        style={styles.keyboardView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Text style={styles.logo}>😉</Text>
            </View>
          </View>
          <Text style={styles.brandTitle}>Winku</Text>
          <Text style={styles.brandSubtitle}>
            Connect • Share • Inspire
          </Text>
        </View>
        
        <View style={styles.formSection}>
          {isLogin ? renderLoginForm() : renderRegisterForm()}
        </View>
      </KeyboardSafeView>
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
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    fontSize: 40,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  formSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
  formTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Styles are now handled by SafeTextInput component
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 15,
    color: '#718096',
  },
  switchLink: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
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
  genderOptionText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '600',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  genderIcon: {
    fontSize: 20,
    marginBottom: 4,
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
  buttonContent: {
    alignItems: 'center',
  },
  buttonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '400',
  },
});