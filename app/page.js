// Like a SQL client context
"use client";

// Like a SQL client querying a database
import { useState } from 'react';
import { ethers } from 'ethers'; // Like a SQL driver for BASE
import { Slider, Typography, TextField } from '@mui/material'; // Like SQL report widgets

export default function Home() {
  // Like SQL variables storing query results
  const [wallet, setWallet] = useState(null);
  const [ethBalance, setEthBalance] = useState('0'); // Like a SQL column for ETH balance
  const [slippage, setSlippage] = useState(3); // Default 3%, like a SQL default value
  const [tokens, setTokens] = useState([]); // Like a SQL table for tokens
  const [selectedTokens, setSelectedTokens] = useState([]); // Like a SQL temp table for selected rows
  const [autoSelectValue, setAutoSelectValue] = useState(0.001); // Like a SQL parameter for filtering
  const [loading, setLoading] = useState(false); // Like a SQL query loading state
  const [walletLoading, setWalletLoading] = useState(false); // Like a SQL connection loading state

  // Alchemy provider, like a SQL database connection
  const provider = new ethers.JsonRpcProvider(
    `https://base-mainnet.g.alchemy.com/v2/O6PWavZ0deeKM15CULWRD`
  );

  // Like running SELECT * FROM wallets WITH validation
  async function connectWallet() {
    setWalletLoading(true); // Like setting SQL connection status
    try {
      // Connect to MetaMask, like opening a SQL connection
      if (!window.ethereum) {
        alert('MetaMask not installed. Please install it.');
        return;
      }
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      if (network.chainId !== BigInt(8453)) {
        // Switch to Base Mainnet, like setting SQL database context
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // Base Mainnet chain ID
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            alert('Base Mainnet not found in MetaMask. Please add it via chainlist.org.');
          } else {
            alert('Failed to switch to Base Mainnet. Please set it in MetaMask.');
          }
          return;
        }
      }
      await browserProvider.send('eth_requestAccounts', []);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      setWallet(address); // Store wallet address, like saving query output
      // Fetch ETH balance, like SELECT balance FROM native_balances
      const balance = await provider.getBalance(address);
      setEthBalance(ethers.formatEther(balance)); // Format to ETH, like converting SQL numeric
      alert('Wallet connected successfully!');
    } catch (error) {
      console.error('Wallet connection failed:', error); // Like logging a SQL error
      alert(`Connection failed: ${error.message}`);
    } finally {
      setWalletLoading(false);
    }
  }

  // Like running SELECT * FROM tokens WHERE wallet = @address
  async function scanWallet() {
    if (!wallet) {
      alert('Please connect wallet first'); // Like a SQL error message
      return;
    }
    setLoading(true); // Like setting query status to 'running'
    try {
      // Include ETH in token list, like UNION with native_balances
      const ethData = {
        address: '0x0000000000000000000000000000000000000000', // ETH has no contract
        symbol: 'ETH',
        balance: ethBalance,
        ethValue: ethBalance, // ETH value = balance
        decimals: 18,
        selected: parseFloat(ethBalance) < autoSelectValue,
      };

      // Mock ERC-20 token list (expand later with BaseScan or Uniswap list)
      const tokenList = [
        { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
        { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
      ];

      const tokenData = [ethData];
      for (const token of tokenList) {
        // Query ERC-20 balance, like SELECT balance FROM tokens
        const contract = new ethers.Contract(
          token.address,
          ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
          provider
        );
        const balance = await contract.balanceOf(wallet);
        const decimals = token.decimals || (await contract.decimals());
        const balanceFormatted = ethers.formatUnits(balance, decimals);

        // Estimate ETH value (mock for now, Uniswap prices later)
        let ethValue = 0;
        try {
          ethValue = balanceFormatted * 0.0001; // Mock price (0.0001 ETH per token)
        } catch {
          ethValue = 'Unknown'; // Like NULL in SQL
        }

        tokenData.push({
          address: token.address,
          symbol: token.symbol,
          balance: balanceFormatted,
          ethValue: ethValue,
          decimals: decimals,
          selected: ethValue !== 'Unknown' && ethValue < autoSelectValue,
        });
      }

      // Update tokens, like updating a SQL table
      setTokens(tokenData);
      setSelectedTokens(tokenData.filter((t) => t.selected).map((t) => t.address));
    } catch (error) {
      console.error('Token scan failed:', error); // Like logging a SQL error
      alert('Failed to scan wallet. Try again.');
    } finally {
      setLoading(false); // Like setting query status to 'complete'
    }
  }

  // Like updating a SQL parameter
  const handleSlippageChange = (event, newValue) => {
    setSlippage(newValue); // Like SET @slippage = 3
  };

  // Like updating SELECT * FROM tokens WHERE selected = true
  const handleTokenSelect = (address) => {
    const updatedTokens = tokens.map((token) =>
      token.address === address ? { ...token, selected: !token.selected } : token
    );
    setTokens(updatedTokens);
    setSelectedTokens(updatedTokens.filter((t) => t.selected).map((t) => t.address));
  };

  // Like toggling SELECT * FROM tokens SET selected = true/false
  const handleSelectAll = () => {
    const allSelected = tokens.every((t) => t.selected);
    const updatedTokens = tokens.map((t) => ({ ...t, selected: !allSelected }));
    setTokens(updatedTokens);
    setSelectedTokens(updatedTokens.filter((t) => t.selected).map((t) => t.address));
  };

  // Like updating WHERE value < @autoSelectValue
  const handleAutoSelectChange = (event) => {
    const value = parseFloat(event.target.value) || 0;
    setAutoSelectValue(value);
    const updatedTokens = tokens.map((t) => ({
      ...t,
      selected: t.ethValue !== 'Unknown' && t.ethValue < value,
    }));
    setTokens(updatedTokens);
    setSelectedTokens(updatedTokens.filter((t) => t.selected).map((t) => t.address));
  };

  return (
    // Like a SQL report layout
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        {/* Left column: Wallet and controls */}
        <div className="space-y-6">
          {/* Header, like a SQL report title */}
          <h1 className="text-3xl font-bold">🌊 Sail Swap</h1>
          <p className="text-lg">Clean up your BASE wallet and swap dust for ETH</p>

          {/* Wallet section, like SELECT * FROM wallets */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <button
              onClick={connectWallet}
              disabled={walletLoading}
              className={`w-full py-2 px-4 rounded text-white ${
                walletLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {walletLoading
                ? 'Connecting...'
                : wallet
                  ? `Connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}`
                  : 'Connect Base Wallet'}
            </button>
            <p className="mt-2">Network: Base Mainnet</p>
            <p>ETH Balance: {ethBalance} ETH</p> {/* Like SELECT balance FROM native_balances */}
          </div>

          {/* Slippage slider, like a SQL parameter input */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <Typography>Slippage Tolerance: {slippage}%</Typography>
            <Slider
              value={slippage}
              onChange={handleSlippageChange}
              min={0}
              max={90} // Max 90%+, per your spec
              step={0.1}
              sx={{ color: 'blue' }}
            />
            {slippage > 10 && (
              <p className="text-yellow-400 text-sm">
                High slippage may result in poor swap rates
              </p>
            )}
          </div>

          {/* Auto-select input, like WHERE value < @threshold */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <TextField
              label="Auto-select tokens below (ETH)"
              type="number"
              value={autoSelectValue}
              onChange={handleAutoSelectChange}
              variant="outlined"
              size="small"
              sx={{ input: { color: 'white' }, label: { color: 'gray' } }}
              inputProps={{ step: 0.001, min: 0 }}
            />
          </div>

          {/* Token table, like SELECT * FROM tokens */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <label>
                <input
                  type="checkbox"
                  checked={tokens.length > 0 && tokens.every((t) => t.selected)}
                  onChange={handleSelectAll}
                  disabled={!tokens.length}
                />{' '}
                Select All
              </label>
              <button
                onClick={scanWallet}
                className={`py-1 px-3 rounded ${
                  loading || !wallet ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={loading || !wallet}
              >
                {loading ? 'Scanning...' : 'Scan Wallet'}
              </button>
            </div>
            {tokens.length === 0 && !loading ? (
              <div className="text-center">No tokens found. Click Scan Wallet.</div>
            ) : loading ? (
              <div className="text-center">Scanning...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="p-2">Select</th>
                    <th className="p-2">Token</th>
                    <th className="p-2">Balance</th>
                    <th className="p-2">ETH Value</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.address} className="border-t border-gray-700">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={token.selected}
                          onChange={() => handleTokenSelect(token.address)}
                        />
                      </td>
                      <td className="p-2">{token.symbol}</td>
                      <td className="p-2">{token.balance}</td>
                      <td className="p-2">{token.ethValue === 'Unknown' ? 'Unknown' : `${token.ethValue} ETH`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Swap button, like EXECUTE swap_procedure */}
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded"
            disabled
          >
            🚀 Execute Swap
          </button>
        </div>

        {/* Right column: Gas and stats */}
        <div className="space-y-6">
          {/* Gas estimation, like a SQL cost estimate */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold">⛽ Gas Estimation</h2>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p>Estimated Gas: 0 ETH</p>
              <p>Transactions: 0 swaps</p>
              <p>Gas Price: 0 gwei</p>
              <p>ETH Price: $0</p>
            </div>
          </div>

          {/* Stats, like a SQL summary report */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <p>Selected Tokens: {selectedTokens.length}</p>
            <p>
              Total Value:{' '}
              {tokens
                .filter((t) => t.selected)
                .reduce((sum, t) => sum + (t.ethValue === 'Unknown' ? 0 : parseFloat(t.ethValue)), 0)
                .toFixed(4)}{' '}
              ETH
            </p>
            <p>
              Estimated Output:{' '}
              {(0.985 *
                tokens
                  .filter((t) => t.selected)
                  .reduce((sum, t) => sum + (t.ethValue === 'Unknown' ? 0 : parseFloat(t.ethValue)), 0)
              ).toFixed(4)}{' '}
              ETH
            </p>
            <p>
              Platform Fee (1.5%):{' '}
              {(0.015 *
                tokens
                  .filter((t) => t.selected)
                  .reduce((sum, t) => sum + (t.ethValue === 'Unknown' ? 0 : parseFloat(t.ethValue)), 0)
              ).toFixed(4)}{' '}
              ETH
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}