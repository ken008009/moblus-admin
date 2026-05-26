// 合约配置
export const CONTRACT_ADDRESS = '0x522d250B04cEDA4CcFFECa834341A125745bE4a2';
export const NEW_SYSTEM_VIEW = '0xfc0c4a339C37634CdF83860009b4544B4ac914c2';
export const PROVIDER_URL = 'https://bsc-dataseed.binance.org/';

export const VIEW_ABI = [
  {
    inputs: [],
    name: 'getAggregated',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'user', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'bool', name: 'cancel', type: 'bool' },
          { internalType: 'uint256', name: 'newOrderCount', type: 'uint256' },
        ],
        internalType: 'struct StakeQueueAggregateView.Item[]',
        name: 'before442',
        type: 'tuple[]',
      },
      {
        components: [
          { internalType: 'address', name: 'user', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'bool', name: 'cancel', type: 'bool' },
          { internalType: 'uint256', name: 'newOrderCount', type: 'uint256' },
        ],
        internalType: 'struct StakeQueueAggregateView.Item[]',
        name: 'after442',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// 用于弹窗查询新系统订单
export const ORDERS_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'a', type: 'address' },
      { internalType: 'uint256', name: 'off', type: 'uint256' },
      { internalType: 'uint256', name: 'lim', type: 'uint256' },
    ],
    name: 'orders',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'index', type: 'uint256' },
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'account', type: 'address' },
          { internalType: 'uint128', name: 'amount', type: 'uint128' },
          { internalType: 'uint128', name: 'cap', type: 'uint128' },
          { internalType: 'uint128', name: 'used', type: 'uint128' },
          { internalType: 'uint128', name: 'linePaid', type: 'uint128' },
          { internalType: 'uint40', name: 'created', type: 'uint40' },
          { internalType: 'uint40', name: 'start', type: 'uint40' },
          { internalType: 'uint40', name: 'claimEffective', type: 'uint40' },
          { internalType: 'uint40', name: 'effectiveNow', type: 'uint40' },
          { internalType: 'uint32', name: 'daysCount', type: 'uint32' },
          { internalType: 'bool', name: 'exited', type: 'bool' },
          { internalType: 'uint256', name: 'capNow', type: 'uint256' },
          { internalType: 'uint256', name: 'left', type: 'uint256' },
          { internalType: 'uint256', name: 'comp', type: 'uint256' },
          { internalType: 'uint256', name: 'lineClaimable', type: 'uint256' },
        ],
        internalType: 'struct View.ordersOut[]',
        name: 'out',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
