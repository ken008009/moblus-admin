import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import viewAbi from '@tools/abi.json'
import userAbi from '@tools/userContract.json'
import { connectWallet, getSigner } from '@app/config/wallet'
import './index.less'

// 只读 provider（用于查询）
const readProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/')

// 格式化地址
const formatAddress = (addr) => {
  if (!addr) return '-'
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

// 格式化金额（18 位精度 → 可读数字）
const formatEther = (value) => {
  try {
    return parseFloat(ethers.utils.formatEther(value)).toFixed(4)
  } catch {
    return '0'
  }
}

// ============ SetCapModal 弹窗组件 ============
const SetCapModal = ({ visible, order, userAddress, onClose, onSuccess }) => {
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 每次打开弹窗时重置
  useEffect(() => {
    if (visible) {
      setInputValue('')
      setError('')
      setSubmitting(false)
    }
  }, [visible])

  if (!visible || !order) return null

  const currentCap = ethers.utils.formatEther(order.cap)

  const handleSubmit = async () => {
    setError('')
    const num = Number(inputValue)
    if (!inputValue || isNaN(num) || num <= 0) {
      setError('请输入有效的数字')
      return
    }

    // 校验：新额度必须大于当前 cap
    const newCapWei = ethers.utils.parseEther(inputValue)
    if (newCapWei.lte(order.cap)) {
      setError(`新额度必须大于当前出局额度 ${currentCap}`)
      return
    }

    setSubmitting(true)
    try {
      await connectWallet()
      const signer = getSigner()
      const buyContract = new ethers.Contract(import.meta.env.VITE_BUY, userAbi, signer)
      const tx = await buyContract.setOrderCap(userAddress, order.index, newCapWei)
      await tx.wait()
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('setOrderCap 失败:', err)
      setError(err.reason || err.message || String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">设置新出局额度</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label>用户地址</label>
            <div className="form-value addr">{formatAddress(userAddress)}</div>
          </div>
          <div className="form-row">
            <label>当前出局额度</label>
            <div className="form-value amount">{currentCap}</div>
          </div>
          <div className="form-row">
            <label>新出局额度</label>
            <input
              type="number"
              className="form-input"
              placeholder="输入新额度，例如 30000"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={submitting}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button className="btn" onClick={onClose} disabled={submitting}>取消</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中...' : '确认设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ 订单页主组件 ============
const Orders = () => {
  const { userAddress } = useParams()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')

  // ref 防闭包陷阱（类似 Vue 中 reactive 的即时响应，React state 是快照有延迟）
  const pageRef = useRef(1)
  const loadingRef = useRef(false)
  const PAGE_SIZE = 10

  // 只读合约实例（使用 abi.json + VITE_VIEW）
  const viewContract = new ethers.Contract(import.meta.env.VITE_VIEW, viewAbi, readProvider)

  // 弹窗状态
  const [capModal, setCapModal] = useState({ visible: false, order: null })

  // 加载订单数据
  const loadOrders = useCallback(async (page, isLoadMore = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError('')

    try {
      // page 是 1-based，合约需要 0-based offset
      const offset = (page - 1) * PAGE_SIZE
      const result = await viewContract.orders(userAddress, offset, PAGE_SIZE)
      console.log('orders 返回数据:', result)
      const newOrders = result || []

      // 返回条数 === PAGE_SIZE 才认为可能有下一页
      setHasMore(newOrders.length === PAGE_SIZE)

      if (isLoadMore) {
        setOrders((prev) => [...prev, ...newOrders])
      } else {
        setOrders(newOrders)
      }
      pageRef.current = page
    } catch (err) {
      console.error(err)
      setError(err.message || String(err))
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [userAddress])

  // 首次加载
  useEffect(() => {
    loadOrders(1)
  }, [loadOrders])

  // 加载更多
  const loadMore = () => {
    if (!hasMore || loadingRef.current) return
    loadOrders(pageRef.current + 1, true)
  }

  // 刷新（setOrderCap 成功后重新加载）
  const refresh = () => {
    pageRef.current = 1
    setHasMore(false)
    loadOrders(1, false)
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <button className="btn" onClick={() => navigate(-1)}>← </button>
        <h2>新系统订单 - <span className="addr">{formatAddress(userAddress)}</span></h2>
      </div>

      {error && <div className="error">加载失败: {error}</div>}

      {!error && orders.length === 0 && !loading && (
        <div className="empty">该用户在新系统暂无订单</div>
      )}

      {orders.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>本单金额</th>
              <th>当前出局额度</th>
              <th style={{ textAlign: 'center' }}>已经出局（管理员不要点按钮）</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="amount">{formatEther(o.amount)}</td>
                <td className="amount">{formatEther(o.cap)}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={o.exited ? 'tag-exited' : 'tag-active'}>
                    {o.exited ? '是' : '否'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    disabled={o.exited}
                    title={o.exited ? '已出局，不可操作' : ''}
                    onClick={() => setCapModal({ visible: true, order: o })}
                  >
                    设置新出局额度
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {loading && <div className="loading">Loading...</div>}

      {!loading && hasMore && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <button className="btn" onClick={loadMore}>加载更多</button>
        </div>
      )}

      <SetCapModal
        visible={capModal.visible}
        order={capModal.order}
        userAddress={userAddress}
        onClose={() => setCapModal({ visible: false, order: null })}
        onSuccess={refresh}
      />
    </div>
  )
}

export default Orders
