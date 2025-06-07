import axios from "axios";
import React, { useState, useEffect } from "react";

export default function SellStockCompoNew() {
  // Format price in Indian currency format (e.g., 1,00,000)

  const [ownedStocks, setOwnedStocks] = useState([]);
  const [latestPrices, setLatestPrices] = useState({});
  const [loadingStocks, setLoadingStocks] = useState({});
  const [sellUnits, setSellUnits] = useState({});
  const [showSellModal, setShowSellModal] = useState(false);
  const [activeSellIndex, setActiveSellIndex] = useState(null);
  const [stockRecommendation, setStockRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [userAmount, setUserAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // Load owned stocks from backend
  useEffect(() => {
    fetchStocksFromBackend();
    fetchUserAmount();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  
    const formatIndianPrice = (price) => {
    if (!price) return "";
    const priceNum = parseFloat(price);
    return priceNum.toLocaleString("en-IN");
  };
  
  // Get appropriate styling for recommendation
  const getRecommendationStyle = (recommendation) => {
    if (!recommendation) return "text-gray-600";
    
    const action = recommendation.action || recommendation.recommendation;
    if (action?.includes("Buy")) return "text-green-600";
    if (action?.includes("Sell")) return "text-red-600";
    return "text-yellow-600";
  };

  
  // Fetch user's current amount
  const fetchUserAmount = async () => {
    const authToken = localStorage.getItem('token');
    if (authToken) {
      try {
        const response = await axios.get('https://stock-prediction-backend-4vxn.onrender.com/api/auth/getamount', {
          headers: {
            'Content-Type': 'application/json',
            'auth-token': authToken
          }
        });
        
        setUserAmount(response.data.amount);
      } catch (error) {
        console.error("Error fetching user amount:", error);
      }
    }
  };
  
  // Fetch stocks from backend
  const fetchStocksFromBackend = async () => {
    setIsLoading(true);
    const authToken = localStorage.getItem('token');
    if (authToken) {
      try {
        const response = await axios.get('https://stock-prediction-backend-4vxn.onrender.com/api/stocks/fetchallstocks', {
          headers: {
            'Content-Type': 'application/json',
            'auth-token': authToken
          }
        });
        
        // Transform backend data to match our frontend format
        const backendStocks = response.data
          .filter(stock => stock.status === "B") // Only show bought stocks
          .map(stock => {            return {
              id: stock._id,
              name: stock.tickerSymbol,
              label: stock.stockName,
              units: stock.quantity,
              price: "0", // This will be fetched from API
              boughtPrice: stock.investedPrice, // Use the invested price from the database
              buyingDate: new Date(stock.buyingDate)
            };
          });
        
        setOwnedStocks(backendStocks);
        
        // Fetch latest prices for all stocks
        backendStocks.forEach((stock) => {
          fetchLatestPrice(stock.name, stock.label);
        });
      } catch (error) {
        console.error("Error fetching stocks from backend:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  // Fetch latest price for a stock
  const fetchLatestPrice = (stockName, stockLabel) => {
    setLoadingStocks((prev) => ({ ...prev, [stockName]: true }));

    axios
      .get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockName}&apikey=XMHAKOFHRRAO7ZCB`
      )
      .then((res) => {
        if (res.data["Global Quote"] && res.data["Global Quote"]["05. price"]) {
          setLatestPrices((prev) => ({
            ...prev,
            [stockName]: res.data["Global Quote"]["05. price"],
          }));
        }
        setLoadingStocks((prev) => ({ ...prev, [stockName]: false }));
      })
      .catch((err) => {
        console.log(err);
        setLoadingStocks((prev) => ({ ...prev, [stockName]: false }));
      });
  };

  // Calculate profit/loss for a stock
  const calculateProfitLoss = (stock) => {
    const currentPrice = latestPrices[stock.name] || stock.price;
    const currentValue = parseFloat(currentPrice) * parseFloat(stock.units);
    const boughtValue = parseFloat(stock.boughtPrice || 0);
    return currentValue - boughtValue;
  };
  
  // Get a selling advice message based on recommendation
  const getSellingAdvice = (stockRecommendation) => {
    if (!stockRecommendation || !stockRecommendation.recommendation) {
      return "No recommendation available.";
    }
    
    const action = stockRecommendation.recommendation.action || stockRecommendation.recommendation.recommendation || "";
    
    if (action.includes("Sell")) {
      return "Our analysis suggests this is a good time to sell this stock.";
    } else if (action.includes("Buy")) {
      return "Our analysis suggests this stock may continue to rise. Consider holding.";
    } else if (action.includes("Hold")) {
      return "Our analysis suggests holding this stock for now.";
    } else {
      return stockRecommendation.recommendation.reason || "No specific recommendation available.";
    }
  };

  // Handle click on sell button to open modal
  const handleSellClick = (index) => {
    setActiveSellIndex(index);
    setShowSellModal(true);
    setStockRecommendation(null);
    
    // Default to full units
    setSellUnits(prev => ({ 
      ...prev, 
      [index]: prev[index] || ownedStocks[index].units 
    }));
    
    // Get AI recommendation
    fetchStockRecommendation(ownedStocks[index].name);
  };
  
  // Fetch stock recommendation from API
  const fetchStockRecommendation = async (stockSymbol) => {
    setLoadingRecommendation(true);
    try {
      // For Indian stocks, we might need to add .NS suffix if not present and remove bse suffix
      let symbol = stockSymbol;
      if (!symbol.endsWith('.NS') && !symbol.endsWith('.BO')) {
        if (symbol.endsWith('.BSE')) {
          symbol = symbol.replace('.BSE', '.NS'); // Convert BSE to NSE
        } else if (symbol.endsWith('.NSE')) {
          symbol = symbol.replace('.NSE', '.NS');
        } else {
          symbol = `${symbol}.NS`; // Default to NSE
        }
      }
      
      const response = await axios.post('https://stock-prediction-flask-1psb.onrender.com//api/analyze/stock', {
        symbol: symbol,
        days: 30,
        model_type:"LSTM",
        risk_tolerance: "medium", // Default risk tolerance
      }, { timeout: 10000 }); // 10 second timeout
      
      setStockRecommendation(response.data);
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      // Set stockRecommendation to null to show error message
      setStockRecommendation(null);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Handle the actual selling after confirmation
  const handleSell = async () => {
    if (activeSellIndex === null) return;
    
    const index = activeSellIndex;
    const stock = ownedStocks[index];
    const unitsToSell = Number(sellUnits[index]);
    
    // Validate units to sell
    if (!unitsToSell || unitsToSell <= 0) {
      alert("Please enter a valid number of units to sell.");
      return;
    }
    
    if (unitsToSell > stock.units) {
      alert(`You only have ${stock.units} units available to sell.`);
      return;
    }
    
    // Calculate selling value
    const currentPrice = latestPrices[stock.name] || stock.price;
    const sellingValue = parseFloat(currentPrice) * unitsToSell;
    
    // Close the modal
    setShowSellModal(false);
    setActiveSellIndex(null);    // Update backend
    const authToken = localStorage.getItem('token');
    if (authToken && stock.id) {
      try {
        const response = await axios.put(
          `https://stock-prediction-backend-4vxn.onrender.com/api/stocks/updatestock/${stock.id}`,
          {
            status: "S", // Always use "S" for selling, regardless of partial or full
            sellingPrice: currentPrice,
            units: unitsToSell
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'auth-token': authToken
            }
          }
        );
          console.log("Stock sold successfully:", response.data);
        
        // Refresh data from the backend
        fetchStocksFromBackend();
        fetchUserAmount();
        
        // Calculate profit or loss
        const boughtValue = parseFloat(stock.boughtPrice || 0) * parseFloat(unitsToSell);
        const soldValue = parseFloat(currentPrice) * parseFloat(unitsToSell);
        const profitLoss = soldValue - boughtValue;
        const isProfitable = profitLoss >= 0;
        
        alert(
          `Successfully sold ${unitsToSell} units of ${
            stock.label || stock.name
          } for ₹${formatIndianPrice(sellingValue.toFixed(2))}!\n
          ${isProfitable ? 'Profit' : 'Loss'}: ₹${formatIndianPrice(Math.abs(profitLoss).toFixed(2))}`
        );
      } catch (error) {
        console.error("Error updating stock:", error);
        alert("Error selling stock. Please try again.");
      }
    }
  };

  // Handle unit input change
  const handleUnitChange = (e, index) => {
    const value = e.target.value;
    setSellUnits(prev => ({
      ...prev,
      [index]: value
    }));
  };

  // Refresh prices for all stocks
  const refreshAllPrices = () => {
    ownedStocks.forEach((stock) => {
      fetchLatestPrice(stock.name, stock.label);
    });
    fetchUserAmount();
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-semibold">Your Portfolio</h2>
        <div className="flex space-x-4 items-center">
          <button
            onClick={refreshAllPrices}
            className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-opacity-80"
          >
            Refresh Prices
          </button>
        </div>
      </div>

      <div className="grid grid-cols-overviewGrid px-5 text-xl font-semibold">
        <h1> Stock Names </h1>
        <h1 className="justify-self-center"> Units </h1>
        <h1 className="justify-self-center"> Purchase Price (₹) </h1>
        <h1 className="justify-self-center"> Current Price (₹) </h1>
        <h1 className="justify-self-center"> Actions </h1>
      </div>

      {/* All cards will be here */}
      <div className="mt-5 space-y-5">
        {isLoading ? (
          <div className="bg-secondary-light p-8 text-center text-lg">
            <p>Loading your stocks...</p>
          </div>
        ) : ownedStocks.length > 0 ? (
          ownedStocks.map((stock, index) => {
            const currentPrice = latestPrices[stock.name] || stock.price;
            const profitLoss = calculateProfitLoss(stock);
            const isProfitable = profitLoss >= 0;

            return (
              <div
                key={index}
                className="grid grid-cols-overviewGrid items-center bg-secondary-light px-5 py-3"
              >
                <div className="flex gap-2">
                  <h1 className="text-xl font-medium">{index + 1}. </h1>
                  <div>
                    <h1 className="text-xl font-medium">{stock.label || stock.name}</h1>
                    <h3
                      className={`text-sm ${
                        isProfitable ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isProfitable ? "+" : ""} ₹ {formatIndianPrice(profitLoss.toFixed(2))}
                    </h3>
                  </div>
                </div>

                <h3 className="justify-self-center text-lg">{stock.units}</h3>

                <h3 className="justify-self-center text-lg">
                  ₹ {formatIndianPrice(stock.boughtPrice || 0)}
                </h3>

                <h3 className="justify-self-center text-lg">
                  {loadingStocks[stock.name]
                    ? "Loading..."
                    : `₹ ${formatIndianPrice(currentPrice)}`}
                </h3>

                <button
                  className="w-4/5 justify-self-center rounded-md border-2 border-secondary py-1 text-black hover:bg-secondary hover:text-white hover:duration-300"
                  onClick={() => handleSellClick(index)}
                >
                  Sell
                </button>
              </div>
            );
          })
        ) : (
          <div className="bg-secondary-light p-8 text-center text-lg">
            <p>
              You don't own any stocks yet. Go to the Buy Stocks section to get
              started!
            </p>
          </div>
        )}
      </div>
      
      {/* Sell Modal */}
      {showSellModal && activeSellIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-w-[95%]">
            <h2 className="text-2xl font-semibold mb-4">Sell Stocks</h2>
            
            {ownedStocks[activeSellIndex] && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="mb-2"><span className="font-medium">Stock:</span> {ownedStocks[activeSellIndex].label || ownedStocks[activeSellIndex].name}</p>
                    <p className="mb-2"><span className="font-medium">Available Units:</span> {ownedStocks[activeSellIndex].units}</p>
                    <p className="mb-2"><span className="font-medium">Purchase Price:</span> ₹{formatIndianPrice(ownedStocks[activeSellIndex].boughtPrice || 0)}</p>
                    <p className="mb-2"><span className="font-medium">Current Price:</span> ₹{formatIndianPrice(latestPrices[ownedStocks[activeSellIndex].name] || ownedStocks[activeSellIndex].price)}</p>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">Units to Sell:</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={ownedStocks[activeSellIndex].units}
                        value={sellUnits[activeSellIndex] || ""}
                        onChange={(e) => handleUnitChange(e, activeSellIndex)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  
                  {/* AI Recommendation Section */}
                  <div className="bg-secondary-light p-4 rounded-md">
                    <h3 className="font-semibold text-lg mb-2">AI Recommendation</h3>
                    
                    {loadingRecommendation ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
                      </div>
                    ) : stockRecommendation ? (
                      <div>
                        <div className="flex justify-between mb-2">
                          <p className="text-gray-600">Suggested Action:</p>
                          <p className={`font-bold ${getRecommendationStyle(stockRecommendation.recommendation)}`}>
                            {stockRecommendation.recommendation.action || stockRecommendation.recommendation.recommendation}
                          </p>
                        </div>
                        <div className="mb-2">
                          <p className="text-gray-600">Predicted Return:</p>
                          <p className={stockRecommendation.predicted_return >= 0 ? "text-green-600" : "text-red-600"}>
                            {stockRecommendation.predicted_return >= 0 ? "+" : ""}
                            {stockRecommendation.predicted_return.toFixed(2)}%
                          </p>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-gray-600">Advice:</p>
                          <p className="text-sm font-medium">{getSellingAdvice(stockRecommendation)}</p>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-gray-600">Analysis:</p>
                          <p className="text-sm">{stockRecommendation.recommendation.reason}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-gray-500">Could not fetch recommendation.</p>
                        <p className="text-sm text-gray-400 mt-1">API server might not be running.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowSellModal(false)} 
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSell} 
                    className="px-4 py-2 bg-secondary text-white rounded hover:bg-opacity-80"
                  >
                    Confirm Sell
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
