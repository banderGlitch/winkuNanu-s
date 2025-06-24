'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { showToast, useFormErrors } from './components/Toast';
import styles from './components/Styles/Spinner.module.css';
import { saveTokens, clearTokens } from './utils/tokenUtils';


export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "male",
    email: "",
    dob: "2025-06-11",
    ipAddress: "",
    userAgent: ""
  });

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    dob: "",
    ipAddress: "",
    userAgent: ""
  });

  // Use the custom hook to handle form errors
  useFormErrors(errors);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      dob: "",
      ipAddress: "",
      userAgent: ""
    };
    
    // Don't show errors on initial render
    if (!Object.values(registerData).some(Boolean)) {
      return true;
    }

    // Validate Username
    if (!registerData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (registerData.username.trim().length < 4) {
      newErrors.username = 'Username must be at least 4 characters long';
      isValid = false;
    }

    // Validate Password
    if (!registerData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
      isValid = false;
    }

    // Validate First Name
    if (!registerData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    // Validate Last Name
    if (!registerData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!registerData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(registerData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate Date of Birth
    if (!registerData.dob) {
      newErrors.dob = 'Date of birth is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsRegisterLoading(true);

    // Add IP address and user agent before submitting
    const updatedRegisterData = {
      ...registerData,
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent
    };

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRegisterData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Registration successful!', 'success');
        // Clear form
        setRegisterData({
          username: "",
          password: "",
          firstName: "",
          lastName: "",
          gender: "male",
          email: "",
          dob: "2025-06-11",
          ipAddress: "",
          userAgent: ""
        });
        setErrors({
          username: "",
          password: "",
          firstName: "",
          lastName: "",
          gender: "",
          email: "",
          dob: "",
          ipAddress: "",
          userAgent: ""
        });
        setIsLogin(true);
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
      console.error('Registration error:', error);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
  
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
  
      const data = await response.json();
  
      if (response.ok && data.success) {
        // Save tokens using the utility function
        saveTokens({
          token: data.token,
          refreshToken: data.refreshToken
        });
  
        showToast('Login successful!', 'success');
  
        // Clear login form
        setLoginData({
          username: '',
          password: ''
        });
  
        // Redirect to feeds page
        router.push('/feeds');
      } else {
        showToast(data.message || 'Login failed', 'error');
        clearTokens();
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
      console.error('Login error:', error);
      clearTokens();
    } finally {
      setIsLoginLoading(false);
    }
  };


  
  return (
    <main>
      <div className="container-fluid pdng0 login-page">
        <div className="row merged">
          <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
            <div className="land-featurearea">
              <div className="land-meta">
                <h1>Winku</h1>
                <p>
                  Winku is free to use for as long as you want with two active projects.
                </p>
                <div className="friend-logo">
                  <span><Image src="/images/wink.png" width={100} height={100} alt="" /></span>
                </div>
                <a href="#" title="" className="folow-me">Follow Us on</a>
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
            <div className="login-reg-bg">
              {isLogin ? (
                <div className="log-reg-area sign">
                  <h2 className="log-title">Login</h2>
                  <p>
                    Don&apos;t use Winku Yet? <a href="#" title="">Take the tour</a> or <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>Join now</a>
                  </p>
                  <form onSubmit={handleLogin}>
                    <div className="form-group">
                      <input 
                        type="text" 
                        required="required"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      />
                      <label className="control-label">Username</label>
                      <i className="mtrl-select"></i>
                    </div>
                    <div className="form-group">
                      <input 
                        type="password" 
                        required="required"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      />
                      <label className="control-label">Password</label>
                      <i className="mtrl-select"></i>
                    </div>
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" />
                        <i className="check-box"></i>Always Remember Me.
                      </label>
                    </div>
                    <a href="#" title="" className="forgot-pwd">Forgot Password?</a>
                    <div className="submit-btns">
                      <button 
                        className={`mtr-btn signin ${styles.button}`}
                        type="submit" 
                        disabled={isLoginLoading}
                      >
                        <span className={styles.buttonContent}>
                          {isLoginLoading ? (
                            <div className={styles.spinner}>
                              <div className={styles.bounce1}></div>
                              <div className={styles.bounce2}></div>
                              <div className={styles.bounce3}></div>
                            </div>
                          ) : 'Login'}
                        </span>
                      </button>
                      <button 
                        className={`mtr-btn signup ${styles.button}`}
                        type="button" 
                        onClick={() => setIsLogin(false)}
                        disabled={isLoginLoading}
                      >
                        <span>Register</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="log-reg-area reg">
                  <h2 className="log-title">Register</h2>
                  <p>
                    Don&apos;t use Winku Yet? <a href="#" title="">Take the tour</a> or <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Already have an account</a>
                  </p>
                  <form onSubmit={handleRegister}>
                    <div className="form-group">
                      <input 
                        type="text" 
                        required="required"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      />
                      <label className="control-label">Username</label>
                      <i className="mtrl-select"></i>
                      {errors.username && <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.username}</div>}
                    </div>
                    <div className="form-group">
                      <input 
                        type="password" 
                        required="required"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      />
                      <label className="control-label">Password</label>
                      <i className="mtrl-select"></i>
                      {errors.password && <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.password}</div>}
                    </div>
                    <div className="form-group">
                      <input 
                        type="text" 
                        required="required"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      />
                      <label className="control-label">First Name</label>
                      <i className="mtrl-select"></i>
                      {errors.firstName && <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.firstName}</div>}
                    </div>
                    <div className="form-group">
                      <input 
                        type="text" 
                        required="required"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      />
                      <label className="control-label">Last Name</label>
                      <i className="mtrl-select"></i>
                      {errors.lastName && <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.lastName}</div>}
                    </div>
                    <div className="form-radio">
                      <div className="radio">
                        <label>
                          <input 
                            type="radio" 
                            name="gender" 
                            checked={registerData.gender === 'male'}
                            onChange={() => setRegisterData({ ...registerData, gender: 'male' })}
                          />
                          <i className="check-box"></i>Male
                        </label>
                      </div>
                      <div className="radio">
                        <label>
                          <input 
                            type="radio" 
                            name="gender"
                            checked={registerData.gender === 'female'}
                            onChange={() => setRegisterData({ ...registerData, gender: 'female' })}
                          />
                          <i className="check-box"></i>Female
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <input 
                        type="email" 
                        required="required"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      />
                      <label className="control-label">Email</label>
                      <i className="mtrl-select"></i>
                      {errors.email && <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.email}</div>}
                    </div>
                    <div className="form-group">
                      <input 
                        type="date" 
                        required="required"
                        value={registerData.dob}
                        onChange={(e) => setRegisterData({ ...registerData, dob: e.target.value })}
                      />
                      <label className="control-label">Date of Birth</label>
                      <i className="mtrl-select"></i>
                      {errors.dob && <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.dob}</div>}
                    </div>
                    <div className="submit-btns">
                      <button 
                        className={`mtr-btn signup ${styles.button}`}
                        type="submit"
                        disabled={isRegisterLoading}
                      >
                        <span className={styles.buttonContent}>
                          {isRegisterLoading ? (
                            <div className={styles.spinner}>
                              <div className={styles.bounce1}></div>
                              <div className={styles.bounce2}></div>
                              <div className={styles.bounce3}></div>
                            </div>
                          ) : 'Register'}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}