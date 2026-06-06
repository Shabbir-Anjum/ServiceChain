"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { hasWallet, getConnectedAddress, connectWallet, onAccountsChanged } from "../lib/wallet";

const WalletCtx = createContext({ address: null, connecting: false, connect: async () => {}, installed: false });

export function useWallet() {
  return useContext(WalletCtx);
}

export default function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setInstalled(hasWallet());
    getConnectedAddress().then(setAddress);
    const off = onAccountsChanged(setAddress);
    return off;
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true); setError(null);
    try {
      const { address } = await connectWallet();
      setAddress(address);
      return address;
    } catch (e) {
      setError(e.message || String(e));
      throw e;
    } finally {
      setConnecting(false);
    }
  }, []);

  return (
    <WalletCtx.Provider value={{ address, connecting, connect, installed, error }}>
      {children}
    </WalletCtx.Provider>
  );
}
