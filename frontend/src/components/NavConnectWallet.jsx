import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollManagerABI from "../abis/PollManager.json";

// eslint-disable-next-line react/prop-types
const NavConnectWallet = ({ setIsConnected }) => {
  const [address, setAddress] = useState(null);

  const contractAddressPollManager = import.meta.env
    .VITE_POLLMANAGER_CONTRACT_ADDRESS;

  const claimFunds = async (signer) => {
    try {
      const contract = new ethers.Contract(contractAddressPollManager, PollManagerABI, signer);
      const tx = await contract.claimFunds(); // Call your contract's claim function
      await tx.wait(); // Wait for the transaction to be mined
      console.log("Claim successful");
    } catch (error) {
      console.error("Claim failed:", error);
      alert("Claim failed: " + error.message);
    }
  };

  // Connect to MetaMask wallet
  const connectWalletMetamask = async () => {
    if (address) return;
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length > 0) {
          const signer = provider.getSigner();
          const walletAddress = await signer.getAddress();
          
          // Save address in localStorage
          localStorage.setItem("walletAddress", walletAddress);
          setAddress(walletAddress);
          setIsConnected(true); // Update connection status
          await claimFunds(signer);
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

  // Handle account changes and load saved address
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsConnected(false); // Update connection status
        localStorage.removeItem("walletAddress");
      } else {
        const newAddress = accounts[0];
        setAddress(newAddress);
        setIsConnected(true); // Update connection status
        localStorage.setItem("walletAddress", newAddress);
      }
    };

    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      setAddress(savedAddress);
      setIsConnected(true); // Update connection status
    }

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    // Cleanup event listener on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [setIsConnected]);

  return (
    <div>
      <button
        onClick={connectWalletMetamask}
        className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors"

      >
        {address
          ? `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`
          : "Connect Wallet"}
      </button>
    </div>
  );
};

export default NavConnectWallet;
