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

// 数据表格组件
const DataTable = ({ items, navigate }) => {
  if (!items || items.length === 0) {
    return <div className="empty">暂无数据</div>
  }

  // 计算汇总数据
  const totalOldStaked = items.reduce((sum, item) => sum.add(item.oldStakedAmount), ethers.BigNumber.from(0))
  const totalOldQueued = items.reduce((sum, item) => sum.add(item.oldQueuedAmount), ethers.BigNumber.from(0))
  const totalNewStake = items.reduce((sum, item) => sum.add(item.newStakeOf), ethers.BigNumber.from(0))
  const nodeCount = items.filter(item => item.isActiveUser).length

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr className="summary-row">
            <th colSpan={2}>汇总 ({items.length}条)</th>
            <th style={{ textAlign: 'center' }}>{nodeCount}个节点</th>
            <th className="col-amount">{formatEther(totalOldStaked)}</th>
            <th className="col-amount">{formatEther(totalOldQueued)}</th>
            <th className="col-amount col-new-stake">{formatEther(totalNewStake)}</th>
            <th></th>
          </tr>
          <tr>
            <th className="col-index">#</th>
            <th style={{ textAlign: 'center' }}>用户地址</th>
            <th style={{ textAlign: 'center' }}>是否节点</th>
            <th className="col-amount">1.0质押金额</th>
            <th className="col-amount">1.0排队金额</th>
            <th className="col-amount col-new-stake">2.0盈利宝金额</th>
            <th style={{ textAlign: 'center' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.user}>
              <td className="col-index">{index + 1}</td>
              <td className="addr" title={item.user} style={{ textAlign: 'center' }}>
                {formatAddress(item.user)}
              </td>
              <td style={{ textAlign: 'center' }}>
                {item.isActiveUser ? (
                  <span className="tag-active-node">是</span>
                ) : (
                  <span className="tag-inactive-node">否</span>
                )}
              </td>
              <td className="amount col-amount">{formatEther(item.oldStakedAmount)}</td>
              <td className="amount col-amount">{formatEther(item.oldQueuedAmount)}</td>
              <td className="amount col-amount">{formatEther(item.newStakeOf)}</td>
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
    </div>
  )
}

// 主页面组件
const Admin = () => {
  const navigate = useNavigate()
  const [dataList, setDataList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // 类似 Vue 的 computed，根据搜索词过滤列表
  const filteredData = useMemo(() => {
    if (!search.trim()) return dataList
    const keyword = search.trim().toLowerCase()
    return dataList.filter((item) => item.user.toLowerCase().includes(keyword))
  }, [dataList, search])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await contract.getAggregated()
      setDataList(result)
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
        <DataTable items={filteredData} navigate={navigate} />
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