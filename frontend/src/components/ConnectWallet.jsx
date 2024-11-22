import { useState, useEffect } from "react";
import { ethers } from "ethers";

// eslint-disable-next-line react/prop-types
const ConnectWallet = ({ setIsConnected }) => {
  const [address, setAddress] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          const signer = provider.getSigner();
          const walletAddress = await signer.getAddress();

          localStorage.setItem("walletAddress", walletAddress);
          setAddress(walletAddress);
          setIsConnected(true); // Update connection status
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

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsConnected(false); // Update connection status
        localStorage.removeItem("walletAddress");
      } else {
        setAddress(accounts[0]);
        setIsConnected(true); // Update connection status
        localStorage.setItem("walletAddress", accounts[0]);
      }
    };

    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      setAddress(savedAddress);
      setIsConnected(true); // Update connection status
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [setIsConnected]);

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={connectWallet}
        className="px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-colors"
      >
        {address
          ? `Connected: ${address?.substring(0, 6)}...`
          : "Connect Wallet"}
      </button>
    </div>
  );
};

export default ConnectWallet;
