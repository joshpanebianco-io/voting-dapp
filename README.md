# 🗳 Voting DApp

A simple decentralized voting application deployed on the Ethereum **Sepolia Testnet** using **Remix**.  
Requires [MetaMask](https://metamask.io/) to interact.

🔗 **Live App**: [https://joshpanebianco-io.github.io/voting-dapp/](https://joshpanebianco-io.github.io/voting-dapp/)

---

## 🚀 Tech Stack

- **React.js**
- **Ethers.js**
- **Tailwind CSS**
- **Solidity**

---

## 🎯 Objectives

- Learn **Solidity** and smart contract development  
- Understand the **Ethereum blockchain ecosystem**  
- Gain hands-on experience with **React.js** and **Web3 front-end libraries** like `ethers.js`

---

## ⚙️ Functionality

- On wallet connection, the user is **automatically funded with Sepolia ETH** from a funding wallet to cover gas  
  (acts as a placeholder for gasless/relayer implementation)
- "Participating" in a poll **mints a unique NFT** representing your vote eligibility
- "Voting" on a poll **burns the NFT**, finalizing the vote

---

## 📱 Mobile Experience

- **If MetaMask is _not_ installed**:  
  The "Connect Wallet" button redirects to the App Store or Google Play

- **If MetaMask _is_ installed**:  
  Automatically deep-links into MetaMask’s internal browser for a smoother dApp connection


