import React, { useState, useEffect } from "react";
import axios from "axios";

const PortfolioRebalancer = () => {
  const [indianStocks, setIndianStocks] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [riskTolerance, setRiskTolerance] = useState("medium");
  const [rebalancedPortfolio, setRebalancedPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch list of Indian stocks on component mount
  useEffect(() => {
    const fetchIndianStocks = async () => {
      try {
        const response = await axios.get("https://stock-prediction-flask-1psb.onrender.com//stocks/indian", { timeout: 5000 });
        // Sort stocks - put those with models first
        const sortedStocks = [...response.data.stocks].sort((a, b) => {
          if (a.has_model && !b.has_model) return -1;
          if (!a.has_model && b.has_model) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setIndianStocks(sortedStocks);
        setError("");
      } catch (err) {
        console.error("Error fetching Indian stocks:", err);
        setError("Failed to load Indian stocks. API might not be running. Please start the Indian Stock API server.");
      }
    };

    fetchIndianStocks();
  }, []);

  // Add a stock to the portfolio
  const addStockToPortfolio = () => {
    const selectedStock = document.getElementById("stockSelector").value;
    if (!selectedStock) return;
    
    // Check if stock already exists in portfolio
    if (portfolio.some(stock => stock.symbol === selectedStock)) {
      setError("This stock is already in your portfolio");
      return;
    }
    
    // Find stock details
    const stockDetails = indianStocks.find(stock => stock.symbol === selectedStock);
    if (!stockDetails) return;
    
    // Add stock with default weight
    const newStock = {
      symbol: stockDetails.symbol,
      name: stockDetails.name,
      weight: 0, // Will be auto-calculated
      currentAllocation: 0 // Will be set by user
    };
    
    // Add to portfolio and update selected stocks
    setPortfolio([...portfolio, newStock]);
    setSelectedStocks([...selectedStocks, selectedStock]);
    
    // Reset error if any
    setError("");
  };

  // Remove a stock from portfolio
  const removeStockFromPortfolio = (stockSymbol) => {
    setPortfolio(portfolio.filter(stock => stock.symbol !== stockSymbol));
    setSelectedStocks(selectedStocks.filter(symbol => symbol !== stockSymbol));
  };

  // Handle allocation change
  const handleAllocationChange = (index, value) => {
    const newPortfolio = [...portfolio];
    newPortfolio[index].currentAllocation = parseFloat(value) || 0;
    setPortfolio(newPortfolio);
  };

  // Format currency in Indian format
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Rebalance portfolio
  const rebalancePortfolio = async () => {
    if (portfolio.length === 0) {
      setError("Please add at least one stock to your portfolio");
      return;
    }
    
    // Calculate total allocation to ensure it's 100%
    const totalAllocation = portfolio.reduce((sum, stock) => sum + stock.currentAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.1) {
      setError(`Total allocation must be 100% (currently ${totalAllocation.toFixed(2)}%)`);
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Normalize allocations to decimal form (0-1 instead of 0-100%)
      const normalizedPortfolio = portfolio.map(stock => ({
        ...stock,
        weight: stock.currentAllocation / 100
      }));
      
      const response = await axios.post("https://stock-prediction-flask-1psb.onrender.com//rebalance/portfolio", {
        portfolio: normalizedPortfolio,
        risk_tolerance: riskTolerance
      });
      
      setRebalancedPortfolio(response.data);
    } catch (err) {
      console.error("Error rebalancing portfolio:", err);
      setError("Failed to rebalance portfolio. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Portfolio Rebalancer</h2>
      
      {/* Stock Selection */}
      <div className="mb-6">
        <label className="block mb-2 text-lg">Add Indian Stocks to Your Portfolio:</label>
        <div className="flex gap-4">
          <select
            id="stockSelector"
            className="border p-2 rounded w-full"
            defaultValue=""
          >
            <option value="">-- Select a Stock --</option>
            {indianStocks.map((stock) => (
              <option 
                key={stock.symbol} 
                value={stock.symbol}
                disabled={selectedStocks.includes(stock.symbol) || !stock.has_model}
                className={!stock.has_model ? "text-gray-400" : ""}
              >
                {stock.name} ({stock.symbol}) {!stock.has_model ? "(No Model)" : stock.has_model ? "★" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={addStockToPortfolio}
            className="bg-secondary text-white px-4 py-2 rounded hover:bg-opacity-90"
          >
            Add Stock
          </button>
        </div>
        
        {/* Risk Tolerance Selection */}
        <div className="mt-4">
          <label className="block mb-2">Risk Tolerance:</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="riskTolerance"
                value="low"
                checked={riskTolerance === "low"}
                onChange={() => setRiskTolerance("low")}
                className="mr-2"
              />
              Low Risk
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="riskTolerance"
                value="medium"
                checked={riskTolerance === "medium"}
                onChange={() => setRiskTolerance("medium")}
                className="mr-2"
              />
              Medium Risk
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="riskTolerance"
                value="high"
                checked={riskTolerance === "high"}
                onChange={() => setRiskTolerance("high")}
                className="mr-2"
              />
              High Risk
            </label>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-2">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {/* Current Portfolio */}
      {portfolio.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Current Portfolio</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border text-left">Stock</th>
                  <th className="py-2 px-4 border text-left">Current Allocation (%)</th>
                  <th className="py-2 px-4 border text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock, index) => (
                  <tr key={stock.symbol}>
                    <td className="py-2 px-4 border">
                      {stock.name} ({stock.symbol})
                    </td>
                    <td className="py-2 px-4 border">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={stock.currentAllocation}
                        onChange={(e) => handleAllocationChange(index, e.target.value)}
                        className="border p-1 rounded w-24"
                      />
                      %
                    </td>
                    <td className="py-2 px-4 border">
                      <button
                        onClick={() => removeStockFromPortfolio(stock.symbol)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={rebalancePortfolio}
              disabled={loading}
              className="bg-secondary text-white px-6 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? "Rebalancing..." : "Rebalance Portfolio"}
            </button>
          </div>
        </div>
      )}
      
      {/* Rebalanced Portfolio Results */}
      {rebalancedPortfolio && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold mb-3">Optimized Portfolio</h3>
          <p className="mb-2 text-sm text-gray-600">
            Based on {riskTolerance} risk tolerance and machine learning predictions
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border text-left">Stock</th>
                  <th className="py-2 px-4 border text-left">Current Weight</th>
                  <th className="py-2 px-4 border text-left">Optimal Weight</th>
                  <th className="py-2 px-4 border text-left">Action</th>
                  <th className="py-2 px-4 border text-left">Expected Return</th>
                </tr>
              </thead>
              <tbody>
                {rebalancedPortfolio.rebalanced_portfolio.map((stock) => (
                  <tr key={stock.symbol}>
                    <td className="py-2 px-4 border">
                      {stock.name} ({stock.symbol})
                    </td>
                    <td className="py-2 px-4 border">
                      {formatPercentage(stock.current_weight * 100)}
                    </td>
                    <td className="py-2 px-4 border font-medium">
                      {formatPercentage(stock.optimal_weight * 100)}
                    </td>
                    <td className={`py-2 px-4 border font-medium ${
                      stock.action === "Buy" ? "text-green-600" : 
                      stock.action === "Sell" ? "text-red-600" : "text-yellow-600"
                    }`}>
                      {stock.action}
                    </td>
                    <td className={`py-2 px-4 border ${
                      stock.expected_return >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {stock.expected_return >= 0 ? "+" : ""}
                      {formatPercentage(stock.expected_return)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium mb-2">About this Rebalancing</h4>
            <p className="text-sm text-gray-700">
              This portfolio rebalancing is generated using Support Vector Regression (SVR) models 
              trained on historical price data of each stock. The algorithm optimizes your portfolio 
              based on predicted returns, volatility, and your selected risk tolerance.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <span className="font-medium">Note:</span> These recommendations should be considered 
              as one of many inputs for your investment decisions, not as guaranteed financial advice.
            </p>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Rebalancing calculated on: {new Date(rebalancedPortfolio.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioRebalancer;
