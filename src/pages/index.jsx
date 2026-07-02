import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import abi from '@tools/abi.json'
import { connectWallet, getSigner, getAccount, onAccountsChanged, parseContractError } from '@app/config/wallet'
import './index.less'

const RPC_URL = import.meta.env.VITE_RPC
const CHAIN_ID = Number(import.meta.env.VITE_CHAINID)
const TOKEN_SYMBOL = import.meta.env.VITE_TOKEN_SYMBOL
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT

const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

const AddressInput = ({ value, onChange, placeholder }) => (
  <div className="input-wrapper">
    <input
      type="text"
      className="form-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <button
        type="button"
        className="input-clear"
        onClick={() => onChange('')}
        aria-label="清空"
      >
        ×
      </button>
    )}
  </div>
)

const Admin = () => {
  const [blacklistAddress, setBlacklistAddress] = useState('')
  const [whitelistAddress, setWhitelistAddress] = useState('')
  const [loading, setLoading] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [account, setAccount] = useState(getAccount())
  const [walletConnecting, setWalletConnecting] = useState(false)
  const [walletError, setWalletError] = useState('')

  const handleConnect = useCallback(async () => {
    setWalletConnecting(true)
    setWalletError('')
    try {
      const { account: addr } = await connectWallet()
      setAccount(addr)
    } catch (err) {
      console.error(err)
      setAccount(null)
      setWalletError(err.message || String(err))
    } finally {
      setWalletConnecting(false)
    }
  }, [])

  useEffect(() => {
    handleConnect()
    return onAccountsChanged(setAccount)
  }, [handleConnect])

  const handleSubmit = async (method, address) => {
    const trimmed = address.trim()
    if (!ethers.utils.isAddress(trimmed)) {
      setError('请输入有效的钱包地址')
      setMessage('')
      return
    }

    if (!getAccount()) {
      setError('请先连接钱包')
      return
    }

    setLoading(method)
    setError('')
    setMessage('')

    try {
      const signer = getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer)
      const tx = await contract[method](trimmed, true)
      setMessage(`交易已提交，哈希: ${tx.hash}`)
      await tx.wait()
      setMessage(`${method === 'setBlacklist' ? '黑名单' : '白名单'}设置成功`)
    } catch (err) {
      console.error(err)
      setError(parseContractError(err))
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1 className="page-title">合约管理</h1>
        <div className="wallet-bar">
          {walletConnecting && <span className="wallet-status">连接中...</span>}
          {!walletConnecting && account && (
            <span className="wallet-status connected" title={account}>
              {formatAddress(account)}
            </span>
          )}
          {!walletConnecting && !account && (
            <button className="btn btn-connect" onClick={handleConnect}>
              连接钱包
            </button>
          )}
        </div>
      </div>

      {walletError && (
        <div className="error wallet-error">
          钱包连接失败: {walletError}
          <button className="btn btn-connect btn-retry" onClick={handleConnect}>重试</button>
        </div>
      )}

      <div className="info-card">
        <div className="info-row"><span>节点 RPC</span><span>{RPC_URL}</span></div>
        <div className="info-row"><span>链 ID</span><span>{CHAIN_ID}</span></div>
        <div className="info-row"><span>代币符号</span><span>{TOKEN_SYMBOL}</span></div>
        <div className="info-row"><span>合约地址</span><span className="addr">{formatAddress(CONTRACT_ADDRESS)}</span></div>
      </div>

      <div className="form-card">
        <label className="form-label">黑名单地址</label>
        <AddressInput
          placeholder="0x..."
          value={blacklistAddress}
          onChange={setBlacklistAddress}
        />
        <button
          className="btn btn-danger btn-block"
          disabled={!!loading || !account}
          onClick={() => handleSubmit('setBlacklist', blacklistAddress)}
        >
          {loading === 'setBlacklist' ? '提交中...' : '设置黑名单'}
        </button>
      </div>

      <div className="form-card">
        <label className="form-label">白名单地址</label>
        <AddressInput
          placeholder="0x..."
          value={whitelistAddress}
          onChange={setWhitelistAddress}
        />
        <button
          className="btn btn-primary btn-block"
          disabled={!!loading || !account}
          onClick={() => handleSubmit('setWhitelist', whitelistAddress)}
        >
          {loading === 'setWhitelist' ? '提交中...' : '设置白名单'}
        </button>
      </div>

      {message && <div className="message">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default Admin
