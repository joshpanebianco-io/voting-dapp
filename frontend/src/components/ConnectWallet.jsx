import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollManagerABI from "../abis/PollManager.json";

// eslint-disable-next-line react/prop-types
const ConnectWallet = ({ setIsConnected }) => {
  const [address, setAddress] = useState(null);

    const contractAddressPollManager = import.meta.env
    .VITE_POLLMANAGER_CONTRACT_ADDRESS;

    const fundingAddressWallet = import.meta.env.VITE_FUNDING_WALLET;
    const rpcProviderUrl = import.meta.env.VITE_RPC_PROVIDER_URL;

    const getFundingWallet = () => {
      const provider = new ethers.providers.JsonRpcProvider(rpcProviderUrl);
      return new ethers.Wallet(fundingAddressWallet, provider);
    };

    const sendFundsToConnectedWallet = async (recipientAddress, ethAmount = "0.005") => {
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
      if (!window.ethereum) {
        alert("Please install MetaMask!");
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
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Large Text Above Button */}
      <div className="text-center text-white font-bold text-7xl sm:text-8xl mb-20 -mt-20 opacity-20">
        <p>Welcome to the future of Voting</p>
        {/* Smaller Text */}
      </div>

      {/* Connect Wallet Button */}
      <button
        onClick={connectWalletMetamask}
        className="w-80 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-white font-semibold text-xl rounded-lg shadow-md hover:from-purple-600 hover:via-blue-500 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all"
      >
        {address
          ? `Connected: ${address.substring(0, 6)}...${address.substring(
              address.length - 4
            )}`
          : "Connect Wallet"}
      </button>

      {/* Large Text Below Button */}
      <div className="text-center text-white font-bold text-4xl sm:text-5xl mt-20 opacity-40">
        <p>Secure. Transparent. Immutable.</p>
      </div>
    </div>
  );
};

export default ConnectWallet;
