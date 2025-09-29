// Supabase Authentication System for TaskFlow
class SupabaseAuthManager {
    constructor() {
        // Initialize with environment variables or fallback values
        this.supabaseUrl = window.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_URL';
        this.supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

        // Initialize Supabase client
        this.supabase = window.supabase?.createClient(this.supabaseUrl, this.supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });

        this.currentUser = null;
        this.currentSession = null;

        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            // Check for existing session
            const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();

            if (sessionError) {
                console.error('Session error:', sessionError);
                return;
            }

            if (session) {
                this.currentSession = session;
                this.currentUser = session.user;

                // Check user approval status
                await this.checkUserApproval();
            }

            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event, session);

                this.currentSession = session;
                this.currentUser = session?.user || null;

                switch (event) {
                    case 'SIGNED_IN':
                        await this.handleSignIn();
                        break;
                    case 'SIGNED_OUT':
                        await this.handleSignOut();
                        break;
                    case 'TOKEN_REFRESHED':
                        console.log('Token refreshed');
                        break;
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: userData.name || '새 사용자',
                        ...userData
                    }
                }
            });

            if (error) {
                throw error;
            }

            console.log('User signed up:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            console.log('User signed in:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) {
                throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async handleSignIn() {
        if (!this.currentUser) return;

        try {
            // Check if user profile exists and get approval status
            const { data: userProfile, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching user profile:', error);
                return;
            }

            if (!userProfile) {
                // Create user profile if it doesn't exist
                const { data: newProfile, error: createError } = await this.supabase
                    .from('users')
                    .insert({
                        id: this.currentUser.id,
                        email: this.currentUser.email,
                        name: this.currentUser.user_metadata?.name || '새 사용자',
                        approval_status: 'pending'
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating user profile:', createError);
                    return;
                }

                console.log('Created new user profile:', newProfile);
            }

            await this.checkUserApproval();
        } catch (error) {
            console.error('Handle sign in error:', error);
        }
    }

    async handleSignOut() {
        this.currentUser = null;
        this.currentSession = null;

        // Clear local storage
        localStorage.removeItem('taskflow-user');
        localStorage.removeItem('taskflow-session');

        // Redirect to login page
        if (window.location.pathname !== '/login.html') {
            window.location.href = '/login.html';
        }
    }

    async checkUserApproval() {
        if (!this.currentUser) return false;

        try {
            const { data: userProfile, error } = await this.supabase
                .from('users')
                .select('approval_status, name')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                console.error('Error checking user approval:', error);
                return false;
            }

            if (userProfile.approval_status === 'approved') {
                // Store user info and redirect to main app
                localStorage.setItem('taskflow-user', JSON.stringify({
                    id: this.currentUser.id,
                    email: this.currentUser.email,
                    name: userProfile.name,
                    approved: true
                }));

                if (window.location.pathname === '/login.html') {
                    window.location.href = '/index.html';
                }
                return true;
            } else if (userProfile.approval_status === 'pending') {
                this.showPendingApprovalMessage();
                return false;
            } else if (userProfile.approval_status === 'rejected') {
                this.showRejectedMessage();
                return false;
            }
        } catch (error) {
            console.error('Check user approval error:', error);
            return false;
        }
    }

    showPendingApprovalMessage() {
        const message = `
            <div style="text-align: center; padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 20px;">
                <h3 style="color: #856404;">승인 대기 중</h3>
                <p>회원가입이 완료되었습니다. 관리자 승인을 기다리고 있습니다.</p>
                <p>승인이 완료되면 이메일로 알림을 받으실 수 있습니다.</p>
                <button onclick="authManager.signOut()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    로그아웃
                </button>
            </div>
        `;

        const container = document.querySelector('.container') || document.body;
        container.innerHTML = message;
    }

    showRejectedMessage() {
        const message = `
            <div style="text-align: center; padding: 20px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 20px;">
                <h3 style="color: #721c24;">가입 승인 거부</h3>
                <p>죄송합니다. 회원가입이 거부되었습니다.</p>
                <p>자세한 내용은 관리자에게 문의해 주세요.</p>
                <button onclick="authManager.signOut()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    로그아웃
                </button>
            </div>
        `;

        const container = document.querySelector('.container') || document.body;
        container.innerHTML = message;
    }

    async getCurrentUser() {
        return this.currentUser;
    }

    async getCurrentSession() {
        return this.currentSession;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    async getUserProfile() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }

    async updateUserProfile(updates) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            const { data, error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Update user profile error:', error);
            return { success: false, error: error.message };
        }
    }

    // Password reset functionality
    async resetPassword(email) {
        try {
            const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePassword(newPassword) {
        try {
            const { data, error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Update password error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize auth manager when page loads
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase is loaded
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase client not loaded. Please include the Supabase JavaScript library.');
        return;
    }

    authManager = new SupabaseAuthManager();
    window.authManager = authManager; // Make it globally accessible
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseAuthManager;
}