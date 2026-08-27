import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const handleLogin = async () => {
    if (!email || !password || (role !== 'admin' && !regNo)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        role,
        registration_number: regNo,
      });
      await loginUser(response);
      // AuthGuard in _layout will automatically redirect to dashboard
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert("Google Login", "Google SSO Demo: Pre-authenticated with College G-Suite Domain @klaso.edu");
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0F172A', '#1E1B4B', '#0F172A']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <View style={styles.logoRow}>
                <Image 
                  source={require('../../assets/images/logo.jpg')} 
                  style={styles.logoImage} 
                />
                <View style={styles.logoTextContainer}>
                  <Text style={styles.brandText}>KLASO</Text>
                  <Text style={styles.taglineText}>Smart Attendance. Smarter Learning.</Text>
                </View>
              </View>
            </View>

            {/* Role Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, role === 'student' && styles.tabActiveStudent]}
                onPress={() => setRole('student')}
              >
                <Ionicons name="school-outline" size={16} color={role === 'student' ? 'white' : '#64748B'} />
                <Text style={[styles.tabText, role === 'student' && styles.tabTextActive]}>Student</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, role === 'faculty' && styles.tabActiveFaculty]}
                onPress={() => setRole('faculty')}
              >
                <Feather name="user-check" size={16} color={role === 'faculty' ? 'white' : '#64748B'} />
                <Text style={[styles.tabText, role === 'faculty' && styles.tabTextActive]}>Faculty</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, role === 'admin' && styles.tabActiveAdmin]}
                onPress={() => setRole('admin')}
              >
                <Feather name="shield" size={16} color={role === 'admin' ? 'white' : '#64748B'} />
                <Text style={[styles.tabText, role === 'admin' && styles.tabTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>College Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder={role === 'student' ? 'student@klaso.edu' : role === 'faculty' ? 'faculty@klaso.edu' : 'admin@klaso.edu'}
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={handleLogin}
              />
            </View>

            {role !== 'admin' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {role === 'student' ? 'Registration Number' : 'Faculty / Employee ID'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={role === 'student' ? '22ABC123' : 'FAC001'}
                  placeholderTextColor="#64748B"
                  value={regNo}
                  onChangeText={setRegNo}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  onSubmitEditing={handleLogin}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Navigate to forgot password screen')}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="********"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Log In as {role.toUpperCase()}</Text>
                  <Feather name="arrow-right" size={18} color="white" style={{marginLeft: 8}} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerTextContainer}>
                <Text style={styles.dividerText}>OR</Text>
              </View>
            </View>

            {/* Google Auth Button */}
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
              <AntDesign name="google" size={18} color="#4285F4" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 12,
  },
  logoTextContainer: {
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9', // Light gray background for tabs container
    padding: 6,
    borderRadius: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActiveStudent: {
    backgroundColor: '#4F46E5',
  },
  tabActiveFaculty: {
    backgroundColor: '#D97706',
  },
  tabActiveAdmin: {
    backgroundColor: '#DC2626',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: 'white',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    color: 'white',
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dividerContainer: {
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerTextContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    gap: 10,
  },
  googleButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
});
