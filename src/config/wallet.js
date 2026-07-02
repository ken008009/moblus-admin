import { ethers } from 'ethers'

const CHAIN_ID = Number(import.meta.env.VITE_CHAINID)
const CHAIN_ID_HEX = '0x' + CHAIN_ID.toString(16)
const RPC_URL = import.meta.env.VITE_RPC
const CHAIN_NAME = 'WMSD'
const TOKEN_SYMBOL = import.meta.env.VITE_TOKEN_SYMBOL

const CHAIN_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: CHAIN_NAME,
  nativeCurrency: { name: TOKEN_SYMBOL, symbol: TOKEN_SYMBOL, decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [],
}

// 钱包单例状态
let _provider = null
let _signer = null
let _account = null
let _connectingPromise = null

/** 切换到目标链，未添加时自动添加 */
async function ensureChain() {
  const current = (await window.ethereum.request({ method: 'eth_chainId' })).toLowerCase()
  if (current === CHAIN_ID_HEX.toLowerCase()) return

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX }],
    })
  } catch (err) {
    if (err.code !== 4902) {
      throw new Error('切换网络失败，请在 MetaMask 中手动添加 WMSD 链（链 ID: 1359）')
    }
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [CHAIN_PARAMS],
      })
    } catch (addErr) {
      throw new Error('添加 WMSD 网络失败，请手动在 MetaMask 中添加：RPC ' + RPC_URL + '，链 ID ' + CHAIN_ID)
    }
  }

  const after = (await window.ethereum.request({ method: 'eth_chainId' })).toLowerCase()
  if (after !== CHAIN_ID_HEX.toLowerCase()) {
    throw new Error('当前未在 WMSD 链上，请手动切换网络后重试')
  }
}

/**
 * 连接 MetaMask 钱包（单例 + Promise 锁，防止并发弹窗）
 */
export async function connectWallet() {
  if (_signer && _account) return { provider: _provider, signer: _signer, account: _account }
  if (_connectingPromise) return _connectingPromise

  _connectingPromise = _doConnect()
  try {
    return await _connectingPromise
  } finally {
    _connectingPromise = null
  }
}

async function _doConnect() {
  if (!window.ethereum) {
    throw new Error('请安装 MetaMask 钱包')
  }

  await ensureChain()

  _provider = new ethers.providers.Web3Provider(window.ethereum)
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  _account = ethers.utils.getAddress(accounts[0])
  _signer = _provider.getSigner()

  localStorage.setItem('account', _account)
  return { provider: _provider, signer: _signer, account: _account }
}

/** 监听账户与链切换 */
export function onAccountsChanged(callback) {
  if (!window.ethereum?.on) return () => {}

  const onAccount = (accounts) => {
    if (accounts.length === 0) {
      _provider = null
      _signer = null
      _account = null
      localStorage.removeItem('account')
      callback(null)
      return
    }
    _account = ethers.utils.getAddress(accounts[0])
    _signer = _provider?.getSigner() ?? null
    localStorage.setItem('account', _account)
    callback(_account)
  }

  const onChain = () => {
    _provider = null
    _signer = null
    _account = null
    localStorage.removeItem('account')
    callback(null)
    connectWallet().then(({ account }) => callback(account)).catch(() => callback(null))
  }

  window.ethereum.on('accountsChanged', onAccount)
  window.ethereum.on('chainChanged', onChain)
  return () => {
    window.ethereum.removeListener('accountsChanged', onAccount)
    window.ethereum.removeListener('chainChanged', onChain)
  }
}

/** 获取当前 signer（需已连接钱包） */
export function getSigner() {
  if (!_signer) throw new Error('钱包未连接')
  return _signer
}

/** 获取当前钱包地址 */
export function getAccount() {
  return _account
}

/** 解析合约调用错误 */
export function parseContractError(err) {
  const revertData = err?.error?.data?.data || err?.data?.data || ''
  if (typeof revertData === 'string' && revertData.startsWith('0x118cdaa7')) {
    return '当前钱包没有合约管理员权限，请切换为合约 Owner 钱包'
  }
  if (err?.code === 'UNPREDICTABLE_GAS_LIMIT' || err?.reason === 'execution reverted') {
    return '交易执行失败：当前钱包可能没有管理员权限，或目标地址无效'
  }
  return err?.reason || err?.message || String(err)
}
