import React, { useState, useEffect } from "react"
import axios from "axios"

export default function OwnedStocks() {
  const [ownedStocks, setOwnedStocks] = useState([]);
  const [latestPrices, setLatestPrices] = useState({});
  const [loadingStocks, setLoadingStocks] = useState({});
   const [loadingAmount, setLoadingAmount] = useState(false)
  const [isLoading, setIsLoading] = useState(true);
  const [userAmount, setUserAmount] = useState(0)

    // Fetch user's current amount
  useEffect(() => {
    const fetchUserAmount = async () => {
      setLoadingAmount(true)
      const authToken = localStorage.getItem('token')
      if (authToken) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/getamount', {
            headers: {
              'Content-Type': 'application/json',
              'auth-token': authToken
            }
          })
          setUserAmount(response.data.amount)
        } catch (error) {
          console.error("Error fetching user amount:", error)
        }
      }
      setLoadingAmount(false)
    }

    fetchUserAmount()
  }, [])

  // Format price in Indian currency format (e.g., 1,00,000)
  const formatIndianPrice = (price) => {
    if (!price) return '';
    const priceNum = parseFloat(price);
    return priceNum.toLocaleString('en-IN');
  }
  
  // Fetch stocks from backend
  useEffect(() => {
    const fetchStocksFromBackend = async () => {
      setIsLoading(true);
      const authToken = localStorage.getItem('token');
      if (authToken) {
        try {
          const response = await axios.get('http://localhost:5000/api/stocks/fetchallstocks', {
            headers: {
              'Content-Type': 'application/json',
              'auth-token': authToken
            }
          });
          
          // Transform backend data to match our frontend format
          const backendStocks = response.data
            .filter(stock => stock.status === "B") // Only show bought stocks
            .map(stock => {              return {
                id: stock._id,
                name: stock.tickerSymbol,
                label: stock.stockName,
                units: stock.quantity,
                price: "0", // This will be fetched from API
                boughtPrice: stock.investedPrice,
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
    
    fetchStocksFromBackend();
  }, []);
  
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

  // Refresh all stock prices
  const refreshAllPrices = () => {
    ownedStocks.forEach((stock) => {
      fetchLatestPrice(stock.name, stock.label);
    });
  };

  const ownedStocksList = ownedStocks.map((stock, index) => {
    // Calculate current value and profit/loss
    const currentPrice = latestPrices[stock.name] || stock.price;
    const currentValue = parseFloat(currentPrice) * parseFloat(stock.units);
    const boughtValue = parseFloat(stock.boughtPrice || 0);
    const profitLoss = currentValue - boughtValue;
    const isProfitable = profitLoss >= 0;
    
    return (
      <div
        key={index}
        className="grid grid-cols-overviewGrid items-center bg-secondary-light px-5 py-3"
      >
        <div className="flex gap-2">
          <h1 className="text-2xl font-medium">{index + 1}. </h1>
          <div>
            <h1 className="text-2xl font-medium">{stock.label || stock.name}</h1>
            <h3>
              Bought at: <span>₹ {formatIndianPrice(boughtValue)}</span>
            </h3>
          </div>
        </div>
        <h3 className="justify-self-center text-lg">{stock.units}</h3>
        <h3 className="justify-self-center text-lg">
          ₹ {formatIndianPrice(boughtValue)}
        </h3>
        <h3 className="justify-self-center text-lg">
          {loadingStocks[stock.name] ? (
            "Loading..."
          ) : (
            `₹ ${formatIndianPrice(currentPrice)}`
          )}
        </h3>
        <h3 className={`justify-self-center text-lg ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
          {isProfitable ? '+' : ''} ₹ {formatIndianPrice(profitLoss.toFixed(2))}
        </h3>
      </div>
    )
  });

  return (
    <div className="mt-8">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-semibold">Your Portfolio Overview</h2>
        {/* total user amount */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
  {loadingAmount ? (
    <div className="text-center text-gray-600">
      <p>Loading account balance...</p>
    </div>
  ) : (
    <div className="bg-secondary-light p-3 rounded-md text-gray-800 shadow-sm">
      <p className="font-semibold text-base">
        Profit Earned: ₹ {formatIndianPrice(userAmount)}
      </p>
    </div>
  )}
  
  <button
    onClick={refreshAllPrices}
    className="px-4 py-2 bg-secondary text-white font-medium rounded-md hover:bg-opacity-90 transition-all duration-200"
  >
    Refresh Prices
  </button>
      </div>

      </div>
      
      <div className="grid grid-cols-overviewGrid px-5 text-xl font-semibold">
        <h1> Stock Names </h1>
        <h1 className="justify-self-center"> Units </h1>
        <h1 className="justify-self-center"> Invested (₹) </h1>
        <h1 className="justify-self-center"> Current Price (₹) </h1>
        <h1 className="justify-self-center"> Net Profit/Loss (₹) </h1>
      </div>
      
      {/* All cards will be here */}
      <div className="mt-5 space-y-5">
        {isLoading ? (
          <div className="bg-secondary-light p-8 text-center text-lg">
            <p>Loading your stocks...</p>
          </div>
        ) : ownedStocks.length > 0 ? (
          ownedStocksList
        ) : (
          <div className="bg-secondary-light p-8 text-center text-lg">
            <p>You don't own any stocks yet. Go to the Buy Stocks section to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
