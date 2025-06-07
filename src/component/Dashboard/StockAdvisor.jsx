import React, { useState, useEffect } from "react";
import axios from "axios";

const StockAdvisor = () => {
  const [indianStocks, setIndianStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState("");
  const [stockAnalysis, setStockAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Add user configurable parameters
  const [analysisParams, setAnalysisParams] = useState({
    days: 30,
    modelType: "auto", // "auto", "svr", "technical"
    riskTolerance: "medium", // "low", "medium", "high"
  });
  
  // Add a state to track if parameters panel is expanded
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    // Fetch list of Indian stocks on component mount
  useEffect(() => {
    const fetchIndianStocks = async () => {
      try {
        const response = await axios.get("https://stock-prediction-flask-1psb.onrender.com/api/stocks", { timeout: 5000 });
        
        // The response now comes with formatted stock data
        const stocksWithModels = response.data.stocks.map(stock => ({
          ...stock,
          has_model: true // Assume all stocks have LSTM models for now
        }));
        
        // Sort stocks alphabetically by name
        const sortedStocks = [...stocksWithModels].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setIndianStocks(sortedStocks);
        setError("");
        
      } catch (err) {
        console.error("Error fetching Indian stocks:", err);
        setError("Failed to load Indian stocks. LSTM API might not be running. Please start the LSTM stock prediction server.");
      }
    };

    fetchIndianStocks();
  }, []);

  // Handle stock selection change
  const handleStockChange = (e) => {
    setSelectedStock(e.target.value);
  };
  
  // Handle parameter changes
  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setAnalysisParams(prev => ({
      ...prev,
      [name]: name === "days" ? parseInt(value, 10) : value
    }));
  };

  // Analyze selected stock with user parameters  // Analyze selected stock with user parameters
  const analyzeStock = async () => {
    if (!selectedStock) {
      setError("Please select a stock to analyze");
      return;
    }

    setLoading(true);
    setError("");
    setStockAnalysis(null);

    try {
      // Make API request to the LSTM prediction service
      const response = await axios.post("https://stock-prediction-flask-1psb.onrender.com/api/analyze/stock", {
        symbol: selectedStock,
        days: analysisParams.days,
        model_type: analysisParams.modelType,
        risk_tolerance: analysisParams.riskTolerance
      });
      
      // Process the response data
      const analysisData = response.data;
      
      // The LSTM API returns structured data, so we can use it directly
      setStockAnalysis(analysisData);
      
    } catch (err) {
      console.error("Error analyzing stock:", err);
      
      // Try to get individual prediction if the analyze endpoint fails
      try {
        const predictionResponse = await axios.get(`https://stock-prediction-flask-1psb.onrender.com/api/stocks/predict/${selectedStock}`);
        const predictionData = predictionResponse.data;
        
        // Format the prediction data to match the expected structure
        const formattedData = {
          symbol: selectedStock,
          company_name: selectedStock.replace('.NS', ''),
          current_price: predictionData.current_price,
          predicted_price: predictionData.predicted_price,
          predicted_return: predictionData.predicted_return,
          model_type: "LSTM",
          analysis_date: predictionData.prediction_date,
          recommendation: {
            action: predictionData.recommendation,
            confidence: predictionData.confidence,
            recommendation: predictionData.recommendation,
            reason: `LSTM model prediction with ${predictionData.confidence} confidence`
          },
          trend_analysis: {
            overall_trend: predictionData.predicted_return > 0 ? "Bullish" : "Bearish"
          },
          risk_metrics: {
            risk: Math.abs(predictionData.predicted_return) / 100
          },
          prediction: {
            next_day_price: predictionData.predicted_price,
            return_percent: predictionData.predicted_return,
            confidence: predictionData.confidence
          }
        };
        
        setStockAnalysis(formattedData);
        
      } catch (predictionErr) {
        console.error("Error getting prediction:", predictionErr);
        setError("Failed to analyze stock. Please ensure the LSTM prediction server is running and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Format currency in Indian format
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "N/A";
    
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  // Get the appropriate color based on recommendation
  const getRecommendationColor = (recommendation) => {
    if (!recommendation) return "text-gray-600";
    
    const action = recommendation.action || recommendation.recommendation;
    if (action?.includes("Buy")) return "text-green-600";
    if (action?.includes("Sell")) return "text-red-600";
    return "text-yellow-600";
  };

  // Format percentage values with + sign for positive values
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return "N/A";
    
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Stock Advisor</h2>

      {/* Stock Selection */}
      <div className="mb-4">
        <label className="block mb-2 text-lg">Select an Indian Stock:</label>
        <div className="flex gap-4">
          <select
            value={selectedStock}
            onChange={handleStockChange}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select a Stock --</option>
            {indianStocks.map((stock) => (
              <option 
                key={stock.symbol} 
                value={stock.symbol}
                className={stock.has_model ? "font-semibold" : ""}
              >
                {stock.name} ({stock.symbol}) {stock.has_model ? "★" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Advanced Options Toggle */}
      <div className="mb-4">
        <button 
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="text-secondary flex items-center"
        >
          <span>{showAdvancedOptions ? "Hide" : "Show"} Advanced Options</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            fill="currentColor" 
            className={`ml-1 transition-transform ${showAdvancedOptions ? "rotate-180" : ""}`}
            viewBox="0 0 16 16"
          >
            <path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/>
          </svg>
        </button>
      </div>
      
      {/* Advanced Options Panel */}
      {showAdvancedOptions && (
        <div className="mb-6 bg-secondary-light p-4 rounded-md">
          <h3 className="font-medium mb-3">Analysis Parameters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Analysis Period */}
            <div>
              <label className="block text-sm mb-1">Analysis Period (days):</label>
              <select 
                name="days" 
                value={analysisParams.days} 
                onChange={handleParamChange}
                className="w-full border rounded p-2"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
              </select>
            </div>
            
            {/* Model Type */}
            <div>
              <label className="block text-sm mb-1">Analysis Method:</label>
              <select 
                name="modelType" 
                value={analysisParams.modelType} 
                onChange={handleParamChange}
                className="w-full border rounded p-2"
              >
                <option value="auto">Automatic (Best Available)</option>
                <option value="svr">Machine Learning Model</option>
                <option value="technical">Technical Analysis</option>
              </select>
            </div>
            
            {/* Risk Tolerance */}
            <div>
              <label className="block text-sm mb-1">Risk Tolerance:</label>
              <select 
                name="riskTolerance" 
                value={analysisParams.riskTolerance} 
                onChange={handleParamChange}
                className="w-full border rounded p-2"
              >
                <option value="low">Conservative (Low Risk)</option>
                <option value="medium">Balanced (Medium Risk)</option>
                <option value="high">Aggressive (High Risk)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-600">
            <p>These parameters will adjust how the analysis is performed and may affect the recommendations.</p>
          </div>
        </div>
      )}
      
      {/* Analysis Button */}
      <div className="mb-4">
        <button
          onClick={analyzeStock}
          disabled={loading || !selectedStock}
          className="bg-secondary text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-50 w-full"
        >
          {loading ? "Analyzing..." : "Analyze Stock"}
        </button>
          {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-2">
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1">Run the app.py in the indian-stock-predictor/src folder to start the LSTM prediction server.</p>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {stockAnalysis && (
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{stockAnalysis.company_name}</h3>
            {stockAnalysis.sector && (
              <span className="text-gray-600">
                Sector: {stockAnalysis.sector || "N/A"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Information */}
            <div className="bg-secondary-light p-4 rounded-md">
              <h4 className="font-medium mb-2">Price Information</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-600">Current Price:</p>
                  <p className="text-xl font-medium">
                    {formatCurrency(stockAnalysis.current_price)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Predicted Price:</p>
                  <p className="text-xl font-medium">
                    {formatCurrency(stockAnalysis.prediction.next_day_price)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Predicted Return:</p>
                  <p
                    className={`text-xl font-medium ${
                      stockAnalysis.prediction.return_percent >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPercentage(stockAnalysis.prediction.return_percent)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Volatility:</p>
                  <p>
                    {stockAnalysis.risk?.volatility?.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Analysis */}
            <div className="bg-secondary-light p-4 rounded-md">
              <h4 className="font-medium mb-2">Market Analysis</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-600">Market Trend:</p>
                  <p
                    className={`font-medium ${
                      stockAnalysis.trend_analysis?.overall_trend === "Bullish"
                        ? "text-green-600"
                        : stockAnalysis.trend_analysis?.overall_trend === "Bearish"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {stockAnalysis.trend_analysis?.overall_trend || stockAnalysis.trend || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Analysis Confidence:</p>
                  <p className="font-medium">
                    {stockAnalysis.recommendation?.confidence || "Medium"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Risk Level:</p>
                  <p>
                    {stockAnalysis.risk?.volatility < 2
                      ? "Low"
                      : stockAnalysis.risk?.volatility < 4
                      ? "Medium"
                      : "High"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated:</p>
                  <p className="text-sm">
                    {stockAnalysis.last_updated && new Date(stockAnalysis.last_updated).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-6 bg-white border rounded-md p-4">
            <h4 className="font-medium mb-2">Recommendation</h4>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600">Our suggestion:</p>
                <p
                  className={`text-2xl font-bold ${getRecommendationColor(
                    stockAnalysis.recommendation
                  )}`}
                >
                  {stockAnalysis.recommendation?.action || stockAnalysis.recommendation?.recommendation || "Hold"}
                </p>
                <p className="text-sm text-gray-600">
                  Confidence: {stockAnalysis.recommendation?.confidence || "Medium"}
                </p>
              </div>
              <div className="md:max-w-md">
                <p className="text-gray-600">Reason:</p>
                <p className="text-sm">{stockAnalysis.recommendation?.reason || "Based on our analysis of recent price movements and market conditions."}</p>
              </div>
            </div>
          </div>

          {/* Technical Indicators (if available) */}
          {stockAnalysis.technical_analysis && (
            <div className="mt-6 bg-white border rounded-md p-4">
              <h4 className="font-medium mb-2">Technical Indicators</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-600">RSI:</p>
                  <p className={`font-medium ${
                    stockAnalysis.technical_analysis.rsi > 70 ? "text-red-600" :
                    stockAnalysis.technical_analysis.rsi < 30 ? "text-green-600" : ""
                  }`}>
                    {stockAnalysis.technical_analysis.rsi.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">MACD:</p>
                  <p className={`font-medium ${
                    stockAnalysis.technical_analysis.macd > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {stockAnalysis.technical_analysis.macd.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Signal:</p>
                  <p className="font-medium">
                    {stockAnalysis.technical_analysis.signal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Bollinger Bands:</p>
                  <p className="text-sm">
                    Upper: {stockAnalysis.technical_analysis.upper_band.toFixed(2)}<br />
                    Lower: {stockAnalysis.technical_analysis.lower_band.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Machine Learning Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium mb-2">About this Prediction</h4>            <p className="text-sm text-gray-700">
              {stockAnalysis.model_type === "LSTM" ? (
                <>
                  This prediction is generated using a Long Short-Term Memory (LSTM) neural network model trained on historical 
                  price data of {stockAnalysis.company_name}. The model analyzes complex patterns in stock price movements, 
                  volume, and technical indicators to forecast potential price changes.
                </>
              ) : stockAnalysis.model_type === "SVR" ? (
                <>
                  This prediction is generated using a Support Vector Regression (SVR) model trained on historical 
                  price data of {stockAnalysis.company_name}. The model analyzes patterns in stock price movements 
                  and market volatility to forecast potential price changes over the selected {analysisParams.days}-day period.
                </>
              ) : (
                <>
                  This analysis is based on technical indicators including Moving Averages, RSI, MACD, and 
                  Bollinger Bands for {stockAnalysis.company_name}. We analyze the past {analysisParams.days} days of 
                  price patterns and market conditions to provide this recommendation.
                </>
              )}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <span className="font-medium">Risk Profile:</span> This recommendation is calibrated for a 
              {analysisParams.riskTolerance === "low" ? " conservative (low risk)" : 
                analysisParams.riskTolerance === "high" ? " aggressive (high risk)" : " balanced (medium risk)"} 
              investing approach.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <span className="font-medium">Note:</span> Stock markets are inherently unpredictable. 
              This analysis should be considered as one of many inputs for your investment decisions, 
              not as guaranteed financial advice.
            </p>
            
            {/* Show fallback warning if applicable */}
            {stockAnalysis.fallback && (
              <p className="text-sm text-red-600 mt-2">
                <span className="font-medium">Warning:</span> Limited data was available for this stock.
                This recommendation is based on simplified analysis and should be considered with extra caution.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdvisor;