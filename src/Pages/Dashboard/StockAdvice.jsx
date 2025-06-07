import React from "react";
import SideBar from "../../component/SideBar";
import LSTMDashboard from "../../component/Dashboard/LSTMDashboard";

const StockAdvice = () => {
  return (
    <div className="bg-background font-Roboto">
      <div className=" lg:grid lg:grid-cols-summary xl:grid-cols-sidebarSetGrid">
        <SideBar active="stockadvice" />
        <div className="mt-4 px-5">
          <div className="mt-5 ml-5">
            <h2 className="text-4xl font-medium">Stock Analysis & Advice</h2>
            <p className="text-gray-600 mt-2 mb-6">
              Get AI-powered analysis and recommendations for Indian stocks
            </p>
            <LSTMDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdvice;
