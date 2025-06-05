import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollManagerABI from "../abis/PollManager.json";

// eslint-disable-next-line react/prop-types
const ConnectWallet = ({ setIsConnected }) => {
  const [address, setAddress] = useState(null);

  const contractAddressPollManager = import.meta.env.VITE_POLLMANAGER_CONTRACT_ADDRESS;
  const fundingAddressWallet = import.meta.env.VITE_FUNDING_WALLET;
  const rpcProviderUrl = import.meta.env.VITE_RPC_PROVIDER_URL;

  const getFundingWallet = () => {
    const provider = new ethers.providers.JsonRpcProvider(rpcProviderUrl);
    return new ethers.Wallet(fundingAddressWallet, provider);
  };

  const sendFundsToConnectedWallet = async (recipientAddress, ethAmount = "0.0075") => {
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
    const dappUrl = "https://joshpanebianco-io.github.io/voting-dapp/";

    if (isMobile && !window.ethereum) {
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

      const lastFundedKey = `lastFunded_${walletAddress}`;
      const lastFundedTime = localStorage.getItem(lastFundedKey);
      const now = Date.now();
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

      if (!lastFundedTime || now - parseInt(lastFundedTime, 10) > oneWeekInMs) {
        alert("Please wait 10 seconds for funds to arrive.");
        await sendFundsToConnectedWallet(walletAddress);
        localStorage.setItem(lastFundedKey, now.toString());
      }
    } catch (error) {
      console.error("Connection failed:", error);
      // alert(`Failed to connect: ${error.message}`);
    }
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsConnected(false);
        localStorage.removeItem("walletAddress");
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
        localStorage.setItem("walletAddress", accounts[0]);
      }
    };

    const checkWalletConnection = async () => {
      if (window.ethereum && window.ethereum.request) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });

          if (accounts.length > 0) {
            const walletAddress = accounts[0];
            setAddress(walletAddress);
            setIsConnected(true);
            localStorage.setItem("walletAddress", walletAddress);
          } else {
            setAddress(null);
            setIsConnected(false);
            localStorage.removeItem("walletAddress");
          }
        } catch (err) {
          console.error("Error checking wallet connection:", err);
        }
      }
    };

    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [setIsConnected]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center text-white font-bold text-6xl sm:text-8xl mb-20 mt-16 sm:mt-8 opacity-20">
        <p>Welcome to the future of Voting</p>
    </div>


      <button
        onClick={connectWalletMetamask}
        className="w-80 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-white font-semibold text-xl rounded-lg shadow-md hover:from-purple-600 hover:via-blue-500 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all"
      >
        {address
          ? `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`
          : "Connect Wallet"}
      </button>

      <div className="text-center text-white font-bold text-4xl sm:text-5xl mt-20 opacity-40">
        <p>Secure. Transparent. Immutable.</p>
      </div>
    </div>
  );
};

export default ConnectWallet;
