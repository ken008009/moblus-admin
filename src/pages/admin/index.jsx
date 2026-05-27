import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import manageAbi from '@tools/manage.json'
import { connectWallet } from '@app/config/wallet'
import './index.less'

// 格式化地址
const formatAddress = (addr) => {
  if (!addr) return '-'
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

// 格式化 ETH 金额
const formatEther = (value) => {
  try {
    return parseFloat(ethers.utils.formatEther(value)).toFixed(4)
  } catch {
    return '0'
  }
}

// 初始化只读 provider 和合约实例（使用 manage.json ABI + .env 中的 VITE_VIEW_MANAGE）
const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/')
const contract = new ethers.Contract(import.meta.env.VITE_VIEW_MANAGE, manageAbi, provider)

// 数据表格区块组件
const DataSection = ({ title, items, navigate }) => {
  if (!items || items.length === 0) {
    return (
      <div className="section">
        <div className="section-title">{title} (0)</div>
        <div className="empty">暂无数据</div>
      </div>
    )
  }

  const totalAmount = items.reduce(
    (sum, item) => sum.add(item.amount),
    ethers.BigNumber.from(0)
  )
  const totalOrders = items.reduce(
    (sum, item) => sum + Number(item.newOrderCount),
    0
  )

  return (
    <div className="section">
      <div className="section-title">{title} ({items.length}条)</div>
      <table>
        <thead>
          <tr>
            <th className="col-index">#</th>
            <th style={{ textAlign: 'center' }}>钱包地址</th>
            <th className="col-amount">金额</th>
            <th style={{ textAlign: 'center' }}>新系统质押订单数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.user}>
              <td className="col-index">{index + 1}</td>
              <td className="addr" title={item.user} style={{ textAlign: 'center' }}>
                {formatAddress(item.user)}
              </td>
              <td className="amount col-amount">{formatEther(item.amount)}</td>
              <td className="count" style={{ textAlign: 'center' }}>{item.newOrderCount.toString()}</td>
              <td>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      await connectWallet()
                      navigate(`/orders/${item.user}`)
                    } catch (err) {
                      alert('钱包连接失败: ' + (err.message || err))
                    }
                  }}
                >
                  查看新系统订单
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12, color: '#888', fontSize: 13 }}>
        汇总：总金额 {formatEther(totalAmount)} | 新系统质押订单总数 {totalOrders}
      </div>
    </div>
  )
}

// 主页面组件
const Admin = () => {
  const navigate = useNavigate()
  const [before442, setBefore442] = useState([])
  const [after442, setAfter442] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // 类似 Vue 的 computed，根据搜索词过滤两个列表
  const filteredBefore = useMemo(() => {
    if (!search.trim()) return before442
    const keyword = search.trim().toLowerCase()
    return before442.filter((item) => item.user.toLowerCase().includes(keyword))
  }, [before442, search])

  const filteredAfter = useMemo(() => {
    if (!search.trim()) return after442
    const keyword = search.trim().toLowerCase()
    return after442.filter((item) => item.user.toLowerCase().includes(keyword))
  }, [after442, search])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [b, a] = await contract.getAggregated()
      setBefore442(b)
      setAfter442(a)
    } catch (err) {
      console.error(err)
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <>
    <div className="admin-page">
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="输入钱包地址搜索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>×</button>
        )}
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">加载失败: {error}</div>}

      {!loading && !error && (
        <>
          <DataSection
            title="老系统已完成质押的钱包和金额汇总"
            items={filteredBefore}
            navigate={navigate}
          />
          <hr className="divider" />
          <DataSection
            title="老系统撤单部分的钱包和金额汇总"
            items={filteredAfter}
            navigate={navigate}
          />
        </>
      )}

    </div>
    <button
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="回到顶部"
      aria-label="回到顶部"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  </>
  )
}

export default Admin