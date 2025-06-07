import React, { useState, useEffect } from "react";
import axios from "axios";

const StockPredictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'predicted_return', direction: 'desc' });
  const [filterRecommendation, setFilterRecommendation] = useState('ALL');

  // Fetch all predictions on component mount
  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.get("https://stock-prediction-flask-1psb.onrender.com/api/stocks/predictions");
      setPredictions(response.data.predictions);
    } catch (err) {
      console.error("Error fetching predictions:", err);
      setError("Failed to load predictions. Please ensure the LSTM prediction server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Sort predictions
  const sortedPredictions = React.useMemo(() => {
    let sortableItems = [...predictions];
    
    // Filter by recommendation if needed
    if (filterRecommendation !== 'ALL') {
      sortableItems = sortableItems.filter(item => 
        item.recommendation === filterRecommendation
      );
    }
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [predictions, sortConfig, filterRecommendation]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get the appropriate color based on recommendation
  const getRecommendationColor = (recommendation) => {
    if (recommendation?.includes("BUY")) return "text-green-600 bg-green-50";
    if (recommendation?.includes("SELL")) return "text-red-600 bg-red-50";
    return "text-yellow-600 bg-yellow-50";
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

  // Format percentage values with + sign for positive values
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return "N/A";
    
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getReturnColor = (value) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Stock Predictions Dashboard</h2>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Predictions"}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Recommendation:</label>
          <select
            value={filterRecommendation}
            onChange={(e) => setFilterRecommendation(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="ALL">All Recommendations</option>
            <option value="BUY">Buy</option>
            <option value="HOLD">Hold</option>
            <option value="SELL">Sell</option>
            <option value="STRONG BUY">Strong Buy</option>
            <option value="STRONG SELL">Strong Sell</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-1">Run the app.py in the indian-stock-predictor/src folder to start the server.</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading predictions...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('symbol')}
                >
                  Stock Symbol
                  {sortConfig.key === 'symbol' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="border border-gray-300 px-4 py-2 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('current_price')}
                >
                  Current Price
                  {sortConfig.key === 'current_price' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="border border-gray-300 px-4 py-2 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('predicted_price')}
                >
                  Predicted Price
                  {sortConfig.key === 'predicted_price' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="border border-gray-300 px-4 py-2 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('predicted_return')}
                >
                  Expected Return
                  {sortConfig.key === 'predicted_return' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="border border-gray-300 px-4 py-2 text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('recommendation')}
                >
                  Recommendation
                  {sortConfig.key === 'recommendation' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="border border-gray-300 px-4 py-2 text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('confidence')}
                >
                  Confidence
                  {sortConfig.key === 'confidence' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Prediction Date
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPredictions.map((stock, index) => (
                <tr key={stock.symbol} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    {stock.symbol}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(stock.current_price)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(stock.predicted_price)}
                  </td>
                  <td className={`border border-gray-300 px-4 py-2 text-right font-medium ${getReturnColor(stock.predicted_return)}`}>
                    {formatPercentage(stock.predicted_return)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(stock.recommendation)}`}>
                      {stock.recommendation}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      stock.confidence === 'High' ? 'bg-green-100 text-green-800' :
                      stock.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stock.confidence}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                    {stock.prediction_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedPredictions.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No predictions available. Please check if the prediction server is running.
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {predictions.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">Buy Recommendations</h3>
            <p className="text-2xl font-bold text-green-600">
              {predictions.filter(p => p.recommendation?.includes('BUY')).length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800">Hold Recommendations</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {predictions.filter(p => p.recommendation?.includes('HOLD')).length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium text-red-800">Sell Recommendations</h3>
            <p className="text-2xl font-bold text-red-600">
              {predictions.filter(p => p.recommendation?.includes('SELL')).length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800">Total Stocks</h3>
            <p className="text-2xl font-bold text-blue-600">
              {predictions.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPredictions;
