import { ethers } from 'ethers'

// 钱包单例状态
let _provider = null
let _signer = null
let _account = null
let _connectingPromise = null

/**
 * 连接 MetaMask 钱包（单例 + Promise 锁，防止并发弹窗）
 * 类似 Vue 项目中的全局 store action，但这里用模块级变量代替 Vuex
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

  // 切换到 BSC 主网
  const currentChain = await window.ethereum.request({ method: 'eth_chainId' })
  if (currentChain !== '0x38') {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }],
      })
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com'],
          }],
        })
      } else {
        throw err
      }
    }
  }

  _provider = new ethers.providers.Web3Provider(window.ethereum)
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  _account = ethers.utils.getAddress(accounts[0])
  _signer = _provider.getSigner()

  localStorage.setItem('account', _account)
  return { provider: _provider, signer: _signer, account: _account }
}

/**
 * 获取当前 signer（需已连接钱包）
 */
export function getSigner() {
  if (!_signer) throw new Error('钱包未连接')
  return _signer
}

/**
 * 获取当前钱包地址
 */
export function getAccount() {
  return _account
}
