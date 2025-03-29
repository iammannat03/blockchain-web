"use client";

import React, { useState, useEffect } from "react";
import GoToHomePage from "@/components/common/GoToHomePage";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";
import {
  FUNDME_CONTRACT_ABI,
  FUNDME_CONTRACT_ADDRESS,
} from "@/constants";
import { Input } from "@/components/ui/input";

const Page = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [windowEthNull, setWindowEthNull] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [contractBalance, setContractBalance] =
    useState("0");
  const [minimumUsd, setMinimumUsd] = useState<string>("");

  const handleLogout = () => {
    setIsConnected(false);
    setSigner(null);
    setProvider(null);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            const connectedProvider =
              new ethers.BrowserProvider(window.ethereum);
            await connectedProvider.ready;
            setProvider(connectedProvider);
            setIsConnected(true);

            const signer =
              await connectedProvider.getSigner();
            setSigner(signer);

            const contract = new ethers.Contract(
              FUNDME_CONTRACT_ADDRESS,
              FUNDME_CONTRACT_ABI,
              signer
            );

            // Get minimum USD amount
            const minUsd = await contract.MINIMUM_USD();
            setMinimumUsd(ethers.formatEther(minUsd));

            await checkOwner(contract, accounts[0]);
            await updateContractBalance();
          }
        } catch (error) {
          console.error("Connection check error:", error);
        }
      }
    };

    const handleAccountChange = async (
      accounts: string[]
    ) => {
      if (accounts.length > 0) {
        const connectedProvider =
          new ethers.BrowserProvider(window.ethereum);
        await connectedProvider.ready;
        setProvider(connectedProvider);
        console.log(
          "Account change - Provider set:",
          connectedProvider
        );

        const signer = await connectedProvider.getSigner();
        setSigner(signer);

        const contract = new ethers.Contract(
          FUNDME_CONTRACT_ADDRESS,
          FUNDME_CONTRACT_ABI,
          signer
        );
        await checkOwner(contract, accounts[0]);
        await updateContractBalance();
      } else {
        handleLogout();
      }
    };

    if (window.ethereum) {
      window.ethereum.on(
        "accountsChanged",
        handleAccountChange
      );
    }

    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountChange
        );
      }
    };
  }, []);

  // Add this function to help with debugging
  const initializeProvider = async () => {
    if (typeof window.ethereum !== "undefined") {
      const newProvider = new ethers.BrowserProvider(
        window.ethereum
      );
      await newProvider.ready;
      console.log("Provider initialized:", newProvider);
      return newProvider;
    }
    return null;
  };

  // Modify handleConnectClick
  const handleConnectClick = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const connectedProvider =
          await initializeProvider();
        if (!connectedProvider) {
          console.error("Failed to initialize provider");
          return;
        }

        setProvider(connectedProvider);
        setIsConnected(true);

        const signer = await connectedProvider.getSigner();
        setSigner(signer);

        const contract = new ethers.Contract(
          FUNDME_CONTRACT_ADDRESS,
          FUNDME_CONTRACT_ABI,
          signer
        );
        await checkOwner(contract, accounts[0]);
        await updateContractBalance();
      } catch (error) {
        console.error("Connection error:", error);
      }
    } else {
      setWindowEthNull(true);
      const defaultProvider = ethers.getDefaultProvider();
      setProvider(defaultProvider);
    }
  };

  const handleFund = async () => {
    if (!signer || !fundAmount) return;

    try {
      setLoading(true);
      const contract = new ethers.Contract(
        FUNDME_CONTRACT_ADDRESS,
        FUNDME_CONTRACT_ABI,
        signer
      );

      // Add error handling for insufficient funds
      const balance = await provider.getBalance(
        signer.address
      );
      if (balance < ethers.parseEther(fundAmount)) {
        alert("Insufficient wallet balance");
        return;
      }

      const tx = await contract.fund({
        value: ethers.parseEther(fundAmount),
      });

      try {
        await tx.wait();
        await updateContractBalance();
        alert("Funding successful!");
        setFundAmount("");
      } catch (waitError: any) {
        if (waitError.code === "ACTION_REJECTED") {
          alert("Transaction rejected by user");
        } else {
          console.error("Transaction failed:", waitError);
          alert(
            "Transaction failed. See console for details."
          );
        }
      }
    } catch (error: any) {
      if (error.code === "INSUFFICIENT_FUNDS") {
        alert("Insufficient funds to complete transaction");
      } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        alert(
          "Transaction may fail - check minimum funding amount"
        );
      } else {
        console.error("Funding failed:", error);
        alert("Funding failed. See console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkOwner = async (
    contract: ethers.Contract,
    address: string
  ) => {
    try {
      const owner = await contract.getOwner();
      setIsOwner(
        owner.toLowerCase() === address.toLowerCase()
      );
    } catch (error) {
      console.error("Error checking owner:", error);
    }
  };

  // Modify updateContractBalance
  const updateContractBalance = async () => {
    try {
      // Try to get current provider or initialize a new one
      let currentProvider = provider;
      if (!currentProvider) {
        console.log(
          "No provider, attempting to initialize..."
        );
        currentProvider = await initializeProvider();
        if (currentProvider) {
          setProvider(currentProvider);
        }
      }

      if (!currentProvider) {
        console.error("Still no provider available");
        return;
      }

      console.log("Using provider to fetch balance...");
      const balance = await currentProvider.getBalance(
        FUNDME_CONTRACT_ADDRESS
      );
      const formattedBalance = ethers.formatEther(balance);
      console.log("Balance fetched:", formattedBalance);
      setContractBalance(formattedBalance);
    } catch (error) {
      console.error(
        "Error in updateContractBalance:",
        error
      );
    }
  };

  const handleWithdraw = async () => {
    if (!signer || !isOwner) return;

    try {
      setLoading(true);
      const contract = new ethers.Contract(
        FUNDME_CONTRACT_ADDRESS,
        FUNDME_CONTRACT_ABI,
        signer
      );

      const tx = await contract.withdraw();

      try {
        await tx.wait();
        await updateContractBalance();
        alert("Withdrawal successful!");
      } catch (waitError) {
        console.error("Transaction failed:", waitError);
        alert(
          "Transaction failed. See console for details."
        );
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
      <div className="w-xl max-sm:w-full max-sm:px-12 flex flex-col items-center">
        <GoToHomePage />
        <div className="flex flex-col items-center justify-center mb-8">
          <span className="relative text-3xl font-bold">
            Crowdfunding App
          </span>
          <span className="text-sm text-gray-500">
            using Ether.js
          </span>
        </div>
        <main>
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center">
              <Button
                onClick={handleConnectClick}
                className="text-black bg-white hover:bg-white/80 cursor-pointer"
              >
                Connect to Wallet
              </Button>
              {windowEthNull && (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">
                    MetaMask not installed
                  </span>
                  <span className="text-lg">
                    using read-only defaults
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
              {signer && (
                <>
                  <span className="text-sm">
                    <span className="font-bold">
                      Connected Address:
                    </span>{" "}
                    {signer.address}
                  </span>
                  <div className="text-center mb-4">
                    <p className="text-lg font-bold">
                      Contract Balance
                    </p>
                    <p>{contractBalance} ETH</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    {minimumUsd && (
                      <p className="text-sm text-center text-gray-400">
                        Minimum funding amount: {minimumUsd}{" "}
                        USD
                      </p>
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount in ETH"
                      value={fundAmount}
                      onChange={(e) =>
                        setFundAmount(e.target.value)
                      }
                    />
                    <Button
                      onClick={handleFund}
                      disabled={
                        loading ||
                        !fundAmount ||
                        Number(fundAmount) <= 0
                      }
                      className="text-black bg-white hover:bg-white/80 cursor-pointer"
                    >
                      {loading
                        ? "Processing..."
                        : "Fund Contract"}
                    </Button>

                    {isOwner && (
                      <Button
                        onClick={handleWithdraw}
                        disabled={
                          loading ||
                          Number(contractBalance) <= 0
                        }
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {loading
                          ? "Processing..."
                          : `Withdraw ${contractBalance} ETH`}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Page;
