"use client";

import React, { useState, useCallback } from "react";
import { Settings as SettingsIcon, Bell, Shield, Eye, EyeOff, Moon, Sun, Laptop } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { ThemeToggle } from "@/components/theme";
import { Navigation } from "@/components/navigation";
import { useNavigationContext } from "@/components/navigation/NavigationContext";

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { currentWidth } = useNavigationContext();
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [marginLeft, setMarginLeft] = useState("0px");

  const toggleNavigation = useCallback(() => {
    setIsNavigationVisible((prev) => !prev);
  }, []);

  // Prevent hydration mismatch
  React.useEffect(() => {
    const updateMargin = () => {
      setMarginLeft(window.innerWidth >= 1024 ? `${currentWidth * 4}px` : "0px");
    };
    updateMargin();
    window.addEventListener("resize", updateMargin);
    return () => window.removeEventListener("resize", updateMargin);
  }, [currentWidth]);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <div className="text-center">
          <SettingsIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access settings</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Navigation Sidebar */}
      <Navigation isVisible={isNavigationVisible} onToggle={toggleNavigation} />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft }}
      >
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto mx-2">
          {/* Header */}
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <SettingsIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                      Settings
                    </h1>
                    <p className="text-gray-600">Manage your account and preferences</p>
                  </div>
                </div>
              </div>

              {/* Settings Cards */}
              <div className="space-y-6">
                {/* Profile Settings */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-blue-500" />
                    Profile Information
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {user?.full_name || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {user?.email || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account ID
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm">
                          {user?.id || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Member Since
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {user?.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appearance Settings */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Moon className="w-5 h-5 text-purple-500" />
                    Appearance
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Laptop className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Theme</p>
                          <p className="text-sm text-gray-500">Choose your preferred theme</p>
                        </div>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-500" />
                    Notifications
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900">Email Notifications</span>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900">Activity Alerts</span>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    Security
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900">Two-Factor Authentication</span>
                      </div>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                        Enable
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900">API Keys</span>
                      </div>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                        Manage
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-orange-500" />
                    Account Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
                      <EyeOff className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Export Data</p>
                      <p className="text-sm text-gray-500">Download your data</p>
                    </button>
                    <button className="p-4 border-2 border-dashed border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all text-center group">
                      <Shield className="w-8 h-8 text-red-400 group-hover:text-red-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Delete Account</p>
                      <p className="text-sm text-gray-500">Permanently remove account</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Lock Icon component
function Lock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
