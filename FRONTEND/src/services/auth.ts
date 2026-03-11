const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  whatsapp: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface GoogleUser {
    id: number;
    name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    profilePicture?: string;
    email_verified?: boolean;
}

class AuthService {
  // Sanitize input to prevent XSS
  private sanitizeInput(input: string): string {
    if (!input) return input;
    // Remove any HTML tags and trim
    return input.replace(/<[^>]*>?/gm, '').trim();
  }

  private sanitizeSignupData(data: SignupData): SignupData {
    return {
      name: this.sanitizeInput(data.name),
      email: this.sanitizeInput(data.email).toLowerCase(),
      password: data.password, // Don't sanitize password
      confirmPassword: data.confirmPassword, // Don't sanitize password
      phone: this.sanitizeInput(data.phone),
      whatsapp: this.sanitizeInput(data.whatsapp)
    };
  }

  private sanitizeLoginData(data: LoginData): LoginData {
    return {
      email: this.sanitizeInput(data.email).toLowerCase(),
      password: data.password, // Don't sanitize password
      rememberMe: data.rememberMe
    };
  }

async signup(data: SignupData) {
    try {
        const sanitizedData = this.sanitizeSignupData(data);
        
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(sanitizedData)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw result;
        }

        // 🔥 ONLY store verification token in sessionStorage, NOT in localStorage
        if (result.requiresVerification && result.token) {
            sessionStorage.setItem('verificationToken', result.token);
            // DO NOT store in localStorage!
        }

        // Remove sensitive data from result before returning
        if (result.user) {
            result.user = {
                id: result.user.id,
                name: result.user.name,
                email_verified: result.user.email_verified
            };
        }

        return result;
    } catch (error) {
        throw error;
    }
}

  async login(data: LoginData) {
    try {
      // Sanitize input before sending
      const sanitizedData = this.sanitizeLoginData(data);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(sanitizedData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }

      // Only store essential token
      if (result.token) {
        localStorage.setItem('token', result.token);
      }

      // Remove sensitive data from result
      if (result.user) {
        result.user = {
          id: result.user.id,
          name: result.user.name,
          email_verified: result.user.email_verified
        };
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  async googleLogin() {
    try {
      // Don't store preAuthPath in localStorage, use sessionStorage instead
      const currentPath = window.location.pathname;
      sessionStorage.setItem('preAuthPath', currentPath);
      
      window.location.href = `${API_URL}/auth/google`;
    } catch (error) {
      console.error('Google login redirect error:', error);
      throw error;
    }
  }

  async handleGoogleCallback(token: string): Promise<{ success: boolean; user?: GoogleUser; requiresVerification?: boolean }> {
    try {
      // Store token
      localStorage.setItem('token', token);
      
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify token');
      }

      // Get redirect path from sessionStorage (more secure)
      const redirectPath = sessionStorage.getItem('preAuthPath') || '/dashboard';
      sessionStorage.removeItem('preAuthPath');

      // Don't store full user data in localStorage
      const requiresVerification = result.user && !result.user.email_verified;

      return {
        success: true,
        user: requiresVerification ? { 
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          email_verified: result.user.email_verified
        } : undefined,
        requiresVerification
      };
    } catch (error) {
      console.error('Google callback handling error:', error);
      localStorage.removeItem('token');
      sessionStorage.removeItem('preAuthPath');
      throw error;
    }
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`${API_URL}/auth/verify`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success && result.user) {
        // Return minimal user data
        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          email_verified: result.user.email_verified
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } finally {
      // Clear all storage
      localStorage.removeItem('token');
      sessionStorage.clear();
    }
  }

  async verifyToken() {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }

      // Sanitize response
      if (result.user) {
        result.user = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          email_verified: result.user.email_verified
        };
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Updated to use token instead of email in URL
  async checkVerificationStatus(verificationToken: string) {
    try {
      const response = await fetch(`${API_URL}/auth/verification-status/${encodeURIComponent(verificationToken)}`);
      return await response.json();
    } catch (error) {
      console.error('Check verification status error:', error);
      throw error;
    }
  }

  // Updated to not send email in request body
  async resendVerification(verificationToken: string) {
    try {
      const response = await fetch(`${API_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }) // Send token instead of email
      });
      return await response.json();
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  // New method for verifying with code
  async verifyWithCode(verificationToken: string, code: string) {
    try {
      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken, code })
      });
      return await response.json();
    } catch (error) {
      console.error('Verify code error:', error);
      throw error;
    }
  }

  async isEmailVerified(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user ? user.email_verified === true : false;
    } catch {
      return false;
    }
  }

async completeProfile(data: any) {
  try {
    const response = await fetch(`${API_URL}/auth/complete-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (result.success && result.token) {
      localStorage.setItem('token', result.token);
      // 🔥 Dispatch event to notify navbar
      window.dispatchEvent(new Event('auth-change'));
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

}

export default new AuthService();