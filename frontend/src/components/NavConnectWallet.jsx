import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollManagerABI from "../abis/PollManager.json";

// eslint-disable-next-line react/prop-types
const NavConnectWallet = ({ setIsConnected }) => {
  const [address, setAddress] = useState(null);

  const contractAddressPollManager = import.meta.env
    .VITE_POLLMANAGER_CONTRACT_ADDRESS;

    const fundingAddressWallet = import.meta.env.VITE_FUNDING_WALLET;
    const rpcProviderUrl = import.meta.env.VITE_RPC_PROVIDER_URL;

    const getFundingWallet = () => {
      const provider = new ethers.providers.JsonRpcProvider(rpcProviderUrl);
      return new ethers.Wallet(fundingAddressWallet, provider);
    };

    const sendFundsToConnectedWallet = async (recipientAddress, ethAmount = "0.01") => {
      const fundingWallet = getFundingWallet();

      try {
        const tx = await fundingWallet.sendTransaction({
          to: recipientAddress,
          value: ethers.utils.parseEther(ethAmount),
        });

        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ ETH sent to ${recipientAddress}`);
        alert(`ETH sent to ${recipientAddress}`);
      } catch (error) {
        console.error("❌ Sending ETH failed:", error);
        alert("Sending ETH failed: " + error.message);
      }
    };

    const connectWalletMetamask = async () => {
      if (address) return;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const dappUrl = "https://joshpanebianco-io.github.io/voting-dapp/"; // Ensure to use your actual domain
      //ngrok local testing
      //const dappUrl = "https://c0f3-2001-8003-ec76-a601-adb8-a4d0-2a07-74f.ngrok-free.app"; // Ensure to use your actual domain

      if (isMobile && !window.ethereum) {
        // Redirect to MetaMask app via deep link
        window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
        return;
      }

      if (!window.ethereum) {
        alert("Please install the MetaMask browser extension.");
        return;
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length === 0) {
          alert("No accounts found. Please unlock MetaMask.");
          return;
        }

        const walletAddress = accounts[0];
        localStorage.setItem("walletAddress", walletAddress);
        setAddress(walletAddress);
        setIsConnected(true);

        // 🔒 Check last funding timestamp
        const lastFundedKey = `lastFunded_${walletAddress}`;
        const lastFundedTime = localStorage.getItem(lastFundedKey);
        const now = Date.now();
        const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

        if (!lastFundedTime || now - parseInt(lastFundedTime, 10) > oneWeekInMs) {
          alert("Please wait 10 seconds for funds to arrive.");
          // Send funds if it's the first time or more than a week has passed
          await sendFundsToConnectedWallet(walletAddress);
          localStorage.setItem(lastFundedKey, now.toString());
        } else {
          const timeLeft = oneWeekInMs - (now - parseInt(lastFundedTime, 10));
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
          // alert(
          //   `You can claim funds again in ${days}d ${hours}h ${minutes}m.`
          // );
        }
      } catch (error) {
        console.error("Connection failed:", error);
        alert(`Failed to connect: ${error.message}`);
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
