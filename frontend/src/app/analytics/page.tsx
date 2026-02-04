"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AnalyticsData {
  user: {
    plan: string;
    usage: {
      requests: number;
      lastReset: number;
    };
    quota: {
      limit: number;
      remaining: number;
      resetTime: number;
    };
  };
  costs: {
    daily: number;
    monthly: number;
    requestCount: number;
    limits: {
      daily: number;
      monthly: number;
      alert: number;
    };
  };
  errors: {
    stats: {
      total: number;
      lastHour: number;
      lastDay: number;
      errorsByUrl: Array<{ url: string; count: number }>;
    };
    recent: Array<{
      timestamp: string;
      error: string;
      url: string;
      method: string;
      timeAgo: string;
    }>;
  };
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    nodeVersion: string;
    environment: string;
    timestamp: number;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/dashboard");
      if (!response.ok) throw new Error("Failed to load analytics");
      
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Monitor system performance and usage</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadAnalytics}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* User Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">User Plan</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                data.user.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                data.user.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {data.user.plan.toUpperCase()}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usage</span>
                <span className="font-medium">{data.user.usage.requests} / {data.user.quota.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getStatusColor(getUsagePercentage(data.user.usage.requests, data.user.quota.limit))}`}
                  style={{ width: `${getUsagePercentage(data.user.usage.requests, data.user.quota.limit)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Resets in {Math.ceil((data.user.quota.resetTime - Date.now()) / (1000 * 60 * 60))} hours
              </p>
            </div>
          </motion.div>

          {/* Daily Costs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Daily Costs</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                ${data.costs.daily.toFixed(4)}
              </div>
              <div className="text-sm text-gray-600">
                Limit: ${data.costs.limits.daily.toFixed(2)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getStatusColor(getUsagePercentage(data.costs.daily, data.costs.limits.daily))}`}
                  style={{ width: `${getUsagePercentage(data.costs.daily, data.costs.limits.daily)}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Monthly Costs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Monthly Costs</h3>
              <span className="text-2xl">📈</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                ${data.costs.monthly.toFixed(4)}
              </div>
              <div className="text-sm text-gray-600">
                Limit: ${data.costs.limits.monthly.toFixed(2)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getStatusColor(getUsagePercentage(data.costs.monthly, data.costs.limits.monthly))}`}
                  style={{ width: `${getUsagePercentage(data.costs.monthly, data.costs.limits.monthly)}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">System Health</h3>
              <span className="text-2xl">🟢</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium">{formatUptime(data.system.uptime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Memory</span>
                <span className="font-medium">{formatBytes(data.system.memory.used)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Environment</span>
                <span className="font-medium">{data.system.environment}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Error Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Error Statistics</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">{data.errors.stats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{data.errors.stats.lastHour}</div>
                  <div className="text-sm text-gray-600">Last Hour</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{data.errors.stats.lastDay}</div>
                  <div className="text-sm text-gray-600">Last Day</div>
                </div>
              </div>
              
              {data.errors.stats.errorsByUrl.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Top Error URLs</h4>
                  <div className="space-y-1">
                    {data.errors.stats.errorsByUrl.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{item.url}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Errors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Errors</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.errors.recent.map((error, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-3 py-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {error.error}
                      </div>
                      <div className="text-xs text-gray-500">
                        {error.method} {error.url} • {error.timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.errors.recent.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No recent errors 🎉
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
