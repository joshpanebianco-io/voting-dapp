import React, { useState } from "react";
import { ethers } from "ethers";

const ConnectWallet = () => {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {

        // Create an instance of Web3Provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Request account access
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          // Get the signer (user's wallet)
          const signer = provider.getSigner();

          // Get the wallet address
          const walletAddress = await signer.getAddress();

          // Set the state with the wallet address and mark the wallet as connected
          setAddress(walletAddress);
          setIsConnected(true);

        } else {
          alert("No accounts found. Please ensure MetaMask is unlocked.");
        }
      } catch (error) {
        console.error("Connection failed:", error);
        alert(`Failed to connect to MetaMask: ${error.message}`);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={connectWallet}
        className="px-8 py-4 bg-blue-500 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        {isConnected
          ? `Connected: ${address?.substring(0, 6)}...`
          : "Connect Wallet"}
      </button>
    </div>
  );
};

export default ConnectWallet;
