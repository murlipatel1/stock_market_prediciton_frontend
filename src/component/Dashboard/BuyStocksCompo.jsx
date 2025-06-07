import axios from "axios"
import React, {useState, useEffect} from "react"
import Select from "react-select"

export default function BuyStocksCompo() {  
  const buyStocksOptions = [
    {
      name: "RELIANCE.BSE",
      label: "Reliance Industries Ltd",
    },
    {
      name: "TCS.BSE",
      label: "Tata Consultancy Services Ltd",
    },
    {
      name: "INFY.BSE",
      label: "Infosys Ltd",
    },
    {
      name: "HDFCBANK.BSE",
      label: "HDFC Bank Ltd",
    },
    {
      name: "ICICIBANK.BSE",
      label: "ICICI Bank Ltd",
    },
    {
      name: "TATAMOTORS.BSE",
      label: "Tata Motors Ltd",
    },
    {
      name: "SBIN.BSE",
      label: "State Bank of India",
    },
    {
      name: "BAJFINANCE.BSE",
      label: "Bajaj Finance Ltd",
    }
  ]

  const [selectedOptions, setSelectedOptions] = useState(null)
  const [stockData, setStockData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [units, setUnits] = useState(0)
  const [ownedStocks, setOwnedStocks] = useState([])
  const [purchaseStatus, setPurchaseStatus] = useState({ success: false, message: '' })

  // Fetch stock price when selecting a stock and units
  useEffect(() => {
    if (selectedOptions && units > 0) {
      setIsLoading(true)
      axios
        .get(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${selectedOptions.name}&apikey=86YSWIZLMO61VB7F`
        )
        .then((res) => {
          setStockData(res.data["Global Quote"])
          setIsLoading(false)
        })
        .catch((err) => {
          console.log(err)
          setIsLoading(false)
        })
    }
  }, [selectedOptions, units])

  // Format price in Indian currency format (e.g., 1,00,000)
  const formatIndianPrice = (price) => {
    if (!price) return '';
    const priceNum = parseFloat(price);
    return priceNum.toLocaleString('en-IN');
  }

  // Buy stock and save to backend
  const handleBuy = async () => {
    if (!selectedOptions || !stockData || units <= 0) {
      alert("Please select a stock and enter a valid number of units");
      return;
    }
    
    const price = parseFloat(stockData["05. price"]);
    const totalPrice = price * parseFloat(units);

    const authToken = localStorage.getItem('token');
    if (!authToken) {
      alert("Please log in to buy stocks");
      return;
    }
    
    try {
      // Add stock to backend
      const response = await axios.post(
        'https://stock-prediction-backend-4vxn.onrender.com/api/stocks/addstock',
        {
          tickerSymbol: selectedOptions.name,
          stockName: selectedOptions.label,
          investedPrice: totalPrice.toFixed(2),
          status: "B", // Bought
          quantity: parseFloat(units)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'auth-token': authToken
          }
        }
      );
      
      console.log("Stock bought successfully:", response.data);
      
      setOwnedStocks(prev => [
        ...prev,
        {
          id: response.data._id,
          name: selectedOptions.name,
          label: selectedOptions.label,
          units: parseFloat(units),
          price: price.toString(),
          boughtPrice: totalPrice.toFixed(2),
        }
      ]);
      
      // Show success message
      setPurchaseStatus({
        success: true,
        message: `Successfully bought ${units} units of ${selectedOptions.label}!`
      });
      
      // Reset form after purchase
      setUnits(0);
      setSelectedOptions(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPurchaseStatus({ success: false, message: '' });
      }, 3000);
      
    } catch (error) {
      console.error("Error buying stock:", error);
      setPurchaseStatus({
        success: false,
        message: `Error: ${error.response?.data?.message || 'Could not complete purchase'}`
      });
    }
  }
  return (
    <div className="mt-8">
      
      {purchaseStatus.message && (
        <div className={`mb-4 p-3 rounded-md ${purchaseStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <p>{purchaseStatus.message}</p>
        </div>
      )}
      
      <div className="grid grid-cols-overviewGrid px-5 text-xl font-semibold">
        <h1> Stock Names </h1>
        <h1 className="justify-self-center"> Units </h1>
        <h1 className="justify-self-center"> Price per unit (₹) </h1>
        <h1 className="justify-self-center"> Total Price (₹) </h1>
      </div>
      {/* All cards will be here */}
      <div className="mt-5 space-y-5">
        <div className="grid grid-cols-overviewGrid items-center bg-secondary-light px-5 py-3">
          <div className="flex gap-2">
            <Select
              options={buyStocksOptions}
              onChange={setSelectedOptions}
              value={selectedOptions}
              placeholder="Select Indian Stock"
              className="w-4/5 rounded-md border-2 border-secondary bg-transparent text-lg"
            />
          </div>
          <input
            type="number"
            pattern="[0-9]*"
            placeholder="select units"
            value={units || ''}
            className="w-[85%] justify-self-center rounded-md border-2 border-secondary bg-transparent px-2 text-center text-lg"
            onChange={(e) => setUnits(e.target.value)}
          />
          <h3 className="justify-self-center text-lg">
            {isLoading ? "Loading..." : stockData && formatIndianPrice(stockData["05. price"])}
          </h3>
          <h3 className="justify-self-center text-lg">
            {isLoading
              ? "Loading..."
              : stockData && formatIndianPrice((stockData["05. price"] * units).toFixed(2))}
          </h3>
          <button
            className="w-4/5 justify-self-center rounded-md border-2 border-secondary py-1 text-black hover:bg-secondary hover:text-white hover:duration-300"
            onClick={handleBuy}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}
