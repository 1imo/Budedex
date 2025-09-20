import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from '@/components/ui/pixelact-ui/input';
import { Label } from '@/components/ui/pixelact-ui/label';
import { signIn } from '../services/account';

const formButtonStyles = `
  .custom-green-form-button {
    background-color: #008001 !important;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: -4px 0px 0px 0px rgb(0, 0, 0), 4px 0px 0px 0px rgb(0, 0, 0), 0px 4px 0px 0px rgb(0, 0, 0), 0px -4px 0px 0px rgb(0, 0, 0), -4px 0px 0px 0px rgb(11, 75, 10) inset, 0px -4px 0px 0px rgb(11, 75, 10) inset !important;
    margin: 4px;
    padding: 7px 16px !important;
    border: none;
    text-decoration: none;
  }
  
  .custom-green-form-button:hover {
    transform: translateY(1px);
  }
`;

export default function SignInForm() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn(formData);

            // Store token in localStorage
            if (result.success && result.data.session?.session_token) {
                localStorage.setItem('auth_token', result.data.session.session_token);
                localStorage.setItem('user', JSON.stringify(result.data.user));

                // Redirect to home page
                window.location.href = '/';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: formButtonStyles }} />
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={{ marginTop: '24px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            all: 'unset',
                            backgroundColor: '#008001',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            boxShadow: '-4px 0px 0px 0px #000000, 4px 0px 0px 0px #000000, 0px 4px 0px 0px #000000, 0px -4px 0px 0px #000000, -4px 0px 0px 0px #0B4B0A inset, 0px -4px 0px 0px #0B4B0A inset',
                            margin: '0',
                            padding: '11px 16px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.1s',
                            border: 'none',
                            textDecoration: 'none',
                            position: 'relative',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                        onMouseOver={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(1px)'}
                        onMouseOut={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(0px)'}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </div>
            </form>
        </>
    );
}
