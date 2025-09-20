// Frontend authentication service

export interface AuthUser {
    username: string;
    email?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    token: string | null;
}

// Get current auth state from localStorage
export function getAuthState(): AuthState {
    if (typeof window === 'undefined') {
        return { isAuthenticated: false, user: null, token: null };
    }

    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        return { isAuthenticated: false, user: null, token: null };
    }

    try {
        const user = JSON.parse(userStr);
        return { isAuthenticated: true, user, token };
    } catch {
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        return { isAuthenticated: false, user: null, token: null };
    }
}

// Save auth state to localStorage
export function setAuthState(user: AuthUser, token: string): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Clear auth state
export function clearAuthState(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
    return getAuthState().isAuthenticated;
}

// Get current user
export function getCurrentUser(): AuthUser | null {
    return getAuthState().user;
}

// Get auth token
export function getAuthToken(): string | null {
    return getAuthState().token;
}

// Logout user
export async function logout(): Promise<void> {
    const { token } = getAuthState();

    if (token) {
        try {
            // Call backend logout endpoint
            await fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:4003'}/api/rest/account/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout API call failed:', error);
        }
    }

    clearAuthState();

    // Redirect to home page
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
}
