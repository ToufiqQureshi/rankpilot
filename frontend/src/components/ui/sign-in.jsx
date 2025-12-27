"use client"

import * as React from "react"
import { useState } from "react";
import { User, Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, Zap } from "lucide-react";
import { API_ENDPOINTS } from "../../lib/api";

const SignIn = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();

        // Basic Validation
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }
        if (isSignUp && !name) {
            setError("Please enter your full name.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setError("");
        setLoading(true);

        // Real Backend Integration
        try {
            const endpoint = isSignUp ? API_ENDPOINTS.REGISTER : API_ENDPOINTS.LOGIN;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    full_name: isSignUp ? name : undefined
                })
            });

            const data = await response.json();

            // New JWT Response Handling
            if (!response.ok) {
                setError(data.detail || "Authentication failed");
                setLoading(false);
                return;
            }

            // Access Granted Logic
            if (onLogin) {
                if (isSignUp) {
                    // SUCCESSFUL REGISTRATION
                    if (data.success) {
                        setError("");
                        setIsSignUp(false);
                        setPassword("");
                        setName("");
                        // Show success message
                        const successMsg = document.createElement('div');
                        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top';
                        successMsg.textContent = '✓ Account created! Please log in.';
                        document.body.appendChild(successMsg);
                        setTimeout(() => successMsg.remove(), 3000);
                    }
                } else {
                    // SUCCESSFUL LOGIN
                    if (data.access_token) {
                        localStorage.setItem('auth_token', data.access_token);
                        onLogin(email, data.user?.name || name);
                    }
                }
            }

        } catch (err) {
            console.error("Auth Error:", err);
            setError("Connection error. Please check if backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden w-full bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px] animate-pulse delay-1000" />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${5 + Math.random() * 10}s infinite ease-in-out`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="relative rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-10 overflow-hidden">
                    {/* Card Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Logo & Title Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                                <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-blue-300 text-xs uppercase tracking-[0.2em] font-bold">
                                    {isSignUp ? "Join the Future" : "Welcome Back"}
                                </p>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                                    {isSignUp ? "Create Account" : "Content AI Agent"}
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    {isSignUp ? "Start your journey with AI-powered content" : "Sign in to continue your creative work"}
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Field (Sign Up Only) */}
                            {isSignUp && (
                                <div className="relative group animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                        <input
                                            placeholder="Full Name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-white/5 text-white placeholder-gray-500 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-white/10"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                    <input
                                        placeholder="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-white/5 text-white placeholder-gray-500 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-white/10"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                    <input
                                        placeholder="Password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 text-white placeholder-gray-500 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-white/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                                        tabIndex="-1"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="relative animate-in slide-in-from-top fade-in duration-200">
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-300">
                                        {error}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative w-full group mt-6"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                                <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" />
                                            <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </div>
                            </button>

                            {/* Toggle Sign Up/In */}
                            <div className="text-center pt-4">
                                <span className="text-sm text-gray-400">
                                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                                    <button
                                        type="button"
                                        className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
                                        onClick={() => {
                                            setIsSignUp(!isSignUp);
                                            setError("");
                                        }}
                                    >
                                        {isSignUp ? "Sign In" : "Sign Up Free"}
                                    </button>
                                </span>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Bottom Tagline */}
                <div className="text-center mt-6 text-gray-500 text-xs">
                    Powered by AI • Secure & Fast • Your Creative Partner
                </div>
            </div>

            {/* CSS Animation for floating particles */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export { SignIn };
