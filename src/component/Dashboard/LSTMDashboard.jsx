import React, { useState } from "react";
import StockAdvisor from "./StockAdvisor";
import StockPredictions from "./StockPredictions";

const LSTMDashboard = () => {
  const [activeTab, setActiveTab] = useState("advisor");

  const tabs = [
    { id: "advisor", label: "Stock Analysis", icon: "📊" },
    { id: "predictions", label: "All Predictions", icon: "📈" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LSTM Stock Prediction Dashboard
          </h1>
          <p className="text-gray-600">
            AI-powered stock analysis using Long Short-Term Memory neural networks
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === "advisor" && (
            <div className="p-6">
              <StockAdvisor />
            </div>
          )}
          
          {activeTab === "predictions" && (
            <div className="p-6">
              <StockPredictions />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-xl">💡</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">About LSTM Predictions</h3>
              <p className="text-sm text-blue-700 mt-1">
                Our predictions use Long Short-Term Memory (LSTM) neural networks trained on historical price data, 
                volume patterns, and technical indicators. The models analyze complex patterns to forecast potential 
                price movements. Remember that all predictions are estimates and should be used alongside other 
                research for investment decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="fixed bottom-4 right-4">
          <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">LSTM Server Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LSTMDashboard;
