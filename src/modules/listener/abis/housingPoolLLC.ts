export default [
  {
    inputs: [],
    name: 'AccessControlBadConfirmation',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'neededRole',
        type: 'bytes32',
      },
    ],
    name: 'AccessControlUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AlreadyExcluded',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AlreadyJoined',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AlreadyReceivedSelection',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AlreadySelected',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AssetAlreadyAssigned',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AssetNotFound',
    type: 'error',
  },
  {
    inputs: [],
    name: 'CriteriaAlreadyMet',
    type: 'error',
  },
  {
    inputs: [],
    name: 'EnforcedPause',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ExpectedPause',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InsufficientParticipants',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InsufficientPayment',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InsufficientPoolBalance',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidConfiguration',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidParticipants',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidValue',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidWithdrawalAmount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MaxParticipantsReached',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MinParticipationNotMet',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NoEligibleParticipants',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotExcluded',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotParticipant',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PaymentTooEarly',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PaymentsNotCompleted',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PoolAlreadyActive',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PoolAlreadyCompleted',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PoolNotActive',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PoolNotCompleted',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  {
    inputs: [],
    name: 'RefundNotAvailable',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'SelectionNotDue',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TitleAlreadyTransferred',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TransferFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'WithdrawalNotAllowed',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'AllPaymentsCompleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'assignedTo',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'purchasePrice',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'assetIdentifier',
        type: 'string',
      },
    ],
    name: 'AssetAcquired',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'AssetFullyPaid',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'AssetOwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'CashbackDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'cycleNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'ContributionMade',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'creditAmount',
        type: 'uint256',
      },
    ],
    name: 'CreditLetterIssued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'creditLetterId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
    ],
    name: 'CreditRedeemedForAsset',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'admin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'action',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'EmergencyAction',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'ExclusionRefundClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'purpose',
        type: 'string',
      },
    ],
    name: 'FundsWithdrawnForAsset',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'penaltyAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'cycleNumber',
        type: 'uint256',
      },
    ],
    name: 'LatePaymentPenalty',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'reason',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'penaltyAmount',
        type: 'uint256',
      },
    ],
    name: 'ParticipantExcluded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'initialContribution',
        type: 'uint256',
      },
    ],
    name: 'ParticipantJoined',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'ParticipantRefunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'cycleNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'creditNFTId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'selectionAmount',
        type: 'uint256',
      },
    ],
    name: 'ParticipantSelected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'paymentsRemaining',
        type: 'uint256',
      },
    ],
    name: 'PaymentCompletionTracked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'cycleNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'missedCount',
        type: 'uint256',
      },
    ],
    name: 'PaymentMissed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'participantCount',
        type: 'uint256',
      },
    ],
    name: 'PoolActivated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'participantCount',
        type: 'uint256',
      },
    ],
    name: 'PoolCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'creditLetterId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'cycle',
        type: 'uint256',
      },
    ],
    name: 'ParticipationTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalParticipants',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalAssetsDistributed',
        type: 'uint256',
      },
    ],
    name: 'PoolCompleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'poolAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalAssetValue',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'maxParticipants',
        type: 'uint256',
      },
    ],
    name: 'PoolCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'reason',
        type: 'string',
      },
    ],
    name: 'PoolPaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'PoolUnpaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'RefundProcessed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newBalance',
        type: 'uint256',
      },
    ],
    name: 'ReserveFundReplenished',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'reason',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'remainingBalance',
        type: 'uint256',
      },
    ],
    name: 'ReserveFundUsed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32',
      },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'TitleTransferCompleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Unpaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'refundAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'penaltyAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'WithdrawalRequested',
    type: 'event',
  },
  {
    inputs: [],
    name: 'ADMIN_ROLE',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ASSET_OFFICER_ROLE',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'COMPLIANCE_ROLE',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MANAGER_ROLE',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'creditLetterId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'assetIdentifier',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'purchasePrice',
        type: 'uint256',
      },
    ],
    name: 'acquireAsset',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'activatePool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'activationConfig',
    outputs: [
      {
        internalType: 'uint256',
        name: 'minInitialContributions',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxActivationTime',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'activator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'activeCreditLetter',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
    ],
    name: 'addToWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'advanceCycle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assetCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'blockchainConfig',
    outputs: [
      {
        internalType: 'address',
        name: 'oracleAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'keeperAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'vrfCoordinator',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'vrfKeyHash',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: 'vrfFee',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
    ],
    name: 'calculateWithdrawalRefund',
    outputs: [
      {
        internalType: 'uint256',
        name: 'refundAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'penaltyAmount',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'canWithdraw',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cancelPoolAndRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cashbackConfig',
    outputs: [
      {
        internalType: 'bool',
        name: 'enabled',
        type: 'bool',
      },
      {
        internalType: 'uint16',
        name: 'cashbackBps',
        type: 'uint16',
      },
      {
        internalType: 'address',
        name: 'rewardToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'minContributionForCashback',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'cashbackCap',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimExclusionRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'completePool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'complianceConfig',
    outputs: [
      {
        internalType: 'bool',
        name: 'kycRequired',
        type: 'bool',
      },
      {
        internalType: 'bool',
        name: 'amlRequired',
        type: 'bool',
      },
      {
        internalType: 'address',
        name: 'complianceOracle',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'minIdentityScore',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'jurisdiction',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contributionRules',
    outputs: [
      {
        internalType: 'uint16',
        name: 'latePaymentPenaltyBps',
        type: 'uint16',
      },
      {
        internalType: 'enum IHousingPoolLLC.PaymentMethod',
        name: 'paymentMethod',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'coreConfig',
    outputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'maxParticipants',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'minParticipants',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'installmentValue',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'totalAssetValue',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'startDate',
        type: 'uint256',
      },
      {
        internalType: 'enum IHousingPoolLLC.AssetType',
        name: 'assetType',
        type: 'uint8',
      },
      {
        internalType: 'string',
        name: 'assetLocation',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'creditLetterNFT',
    outputs: [
      {
        internalType: 'contract ICreditLetterNFT',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'creditLetters',
    outputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'creditAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'issuedCycle',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'redeemed',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentCycle',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'cycleContributions',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'cycles',
    outputs: [
      {
        internalType: 'uint256',
        name: 'totalCollected',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'managementFee',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'reserveContribution',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'selectedParticipant',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'selectionTimestamp',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'selectionDone',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'participantCount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'excludedMembers',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'exclusionRules',
    outputs: [
      {
        internalType: 'uint256',
        name: 'maxConsecutiveMissedPayments',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxTotalMissedPayments',
        type: 'uint256',
      },
      {
        internalType: 'uint16',
        name: 'exclusionPenaltyBps',
        type: 'uint16',
      },
      {
        internalType: 'enum IHousingPoolLLC.ExclusionRefundPolicy',
        name: 'refundPolicy',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveParticipantCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllParticipants',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
    ],
    name: 'getAsset',
    outputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'assetIdentifier',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'purchasePrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'acquisitionDate',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'assignedParticipant',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'remainingPayments',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'titleTransferred',
            type: 'bool',
          },
        ],
        internalType: 'struct HousingPoolLLC.AssetHolding',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAvailableBalanceForAssets',
    outputs: [
      {
        internalType: 'uint256',
        name: 'totalBalance',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'reserveFund',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'availableForAssets',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'cycle',
        type: 'uint256',
      },
    ],
    name: 'getCycleData',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'totalCollected',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'managementFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'reserveContribution',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'selectedParticipant',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'selectionTimestamp',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'selectionDone',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'participantCount',
            type: 'uint256',
          },
        ],
        internalType: 'struct HousingPoolLLC.CycleData',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
    ],
    name: 'getParticipant',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'wallet',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'joinedCycle',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'totalContributed',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'missedPayments',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'consecutiveMissedPayments',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'lastPaymentCycle',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'hasReceivedSelection',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'selectionCycle',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'isActive',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'reputationScore',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'assignedAssetId',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'paymentsCompleted',
            type: 'uint256',
          },
          {
            internalType: 'enum IHousingPoolLLC.MemberStatus',
            name: 'memberStatus',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'penaltyDebt',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'cashbackEarned',
            type: 'uint256',
          },
        ],
        internalType: 'struct HousingPoolLLC.Participant',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
    ],
    name: 'getPaymentCompletionStatus',
    outputs: [
      {
        internalType: 'bool',
        name: 'hasAsset',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'remainingPayments',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'isFullyPaid',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPoolCompletionStatus',
    outputs: [
      {
        internalType: 'bool',
        name: 'isCompleted',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'totalSelected',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'totalActive',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'canComplete',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPoolInfo',
    outputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'maxParticipants',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'currentParticipants',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'totalValue',
        type: 'uint256',
      },
      {
        internalType: 'enum IHousingPoolLLC.PoolStatus',
        name: 'poolStatus',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getReserveFundStatus',
    outputs: [
      {
        internalType: 'uint256',
        name: 'currentBalance',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'minBalance',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxBalance',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'isReplenishing',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'cyclesRemaining',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
    ],
    name: 'getRoleAdmin',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
    ],
    name: 'getTitleTransferStatus',
    outputs: [
      {
        internalType: 'bool',
        name: 'exists',
        type: 'bool',
      },
      {
        internalType: 'address',
        name: 'assignedTo',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'remainingPayments',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'titleTransferred',
        type: 'bool',
      },
      {
        internalType: 'bool',
        name: 'canTransfer',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'hasRole',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'name',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'description',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'maxParticipants',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'minParticipants',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'installmentValue',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'totalAssetValue',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'startDate',
            type: 'uint256',
          },
          {
            internalType: 'enum IHousingPoolLLC.AssetType',
            name: 'assetType',
            type: 'uint8',
          },
          {
            internalType: 'string',
            name: 'assetLocation',
            type: 'string',
          },
        ],
        internalType: 'struct IHousingPoolLLC.CorePoolConfig',
        name: '_coreConfig',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint16',
            name: 'latePaymentPenaltyBps',
            type: 'uint16',
          },
          {
            internalType: 'enum IHousingPoolLLC.PaymentMethod',
            name: 'paymentMethod',
            type: 'uint8',
          },
        ],
        internalType: 'struct IHousingPoolLLC.ContributionRules',
        name: '_contributionRules',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'maxConsecutiveMissedPayments',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxTotalMissedPayments',
            type: 'uint256',
          },
          {
            internalType: 'uint16',
            name: 'exclusionPenaltyBps',
            type: 'uint16',
          },
          {
            internalType: 'enum IHousingPoolLLC.ExclusionRefundPolicy',
            name: 'refundPolicy',
            type: 'uint8',
          },
        ],
        internalType: 'struct IHousingPoolLLC.ExclusionRules',
        name: '_exclusionRules',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'bool',
            name: 'withdrawalAllowed',
            type: 'bool',
          },
          {
            internalType: 'uint16',
            name: 'earlyWithdrawalPenaltyBps',
            type: 'uint16',
          },
          {
            internalType: 'uint256',
            name: 'minParticipationMonths',
            type: 'uint256',
          },
          {
            internalType: 'uint16',
            name: 'withdrawalFeeBps',
            type: 'uint16',
          },
        ],
        internalType: 'struct IHousingPoolLLC.WithdrawalRules',
        name: '_withdrawalRules',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'bool',
            name: 'enabled',
            type: 'bool',
          },
          {
            internalType: 'uint16',
            name: 'cashbackBps',
            type: 'uint16',
          },
          {
            internalType: 'address',
            name: 'rewardToken',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'minContributionForCashback',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'cashbackCap',
            type: 'uint256',
          },
        ],
        internalType: 'struct IHousingPoolLLC.CashbackConfig',
        name: '_cashbackConfig',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint16',
            name: 'reserveBps',
            type: 'uint16',
          },
          {
            internalType: 'uint16',
            name: 'replenishmentExtraBps',
            type: 'uint16',
          },
          {
            internalType: 'uint8',
            name: 'replenishmentMaxMonths',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'minReserveBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxReserveBalance',
            type: 'uint256',
          },
        ],
        internalType: 'struct IHousingPoolLLC.ReserveFundConfig',
        name: '_reserveConfig',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint16',
            name: 'managementFeeBps',
            type: 'uint16',
          },
          {
            internalType: 'enum IHousingPoolLLC.FeeChargingScheduleType',
            name: 'chargingSchedule',
            type: 'uint8',
          },
          {
            internalType: 'address',
            name: 'feeCollector',
            type: 'address',
          },
          {
            internalType: 'uint16',
            name: 'performanceFeeBps',
            type: 'uint16',
          },
        ],
        internalType: 'struct IHousingPoolLLC.PoolManagementConfig',
        name: '_poolManagement',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'bool',
            name: 'insuranceEnabled',
            type: 'bool',
          },
          {
            internalType: 'uint16',
            name: 'insurancePremiumBps',
            type: 'uint16',
          },
          {
            internalType: 'address',
            name: 'insuranceProvider',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'coverageAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'deductible',
            type: 'uint256',
          },
        ],
        internalType: 'struct IHousingPoolLLC.InsuranceConfig',
        name: '_insuranceConfig',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'bool',
            name: 'kycRequired',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'amlRequired',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'complianceOracle',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'minIdentityScore',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'jurisdiction',
            type: 'string',
          },
        ],
        internalType: 'struct IHousingPoolLLC.ComplianceConfig',
        name: '_complianceConfig',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'oracleAddress',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'keeperAddress',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'vrfCoordinator',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'vrfKeyHash',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'vrfFee',
            type: 'uint256',
          },
        ],
        internalType: 'struct IHousingPoolLLC.BlockchainConfig',
        name: '_blockchainConfig',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'minInitialContributions',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxActivationTime',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'activator',
            type: 'address',
          },
        ],
        internalType: 'struct IHousingPoolLLC.PoolActivationConfig',
        name: '_activationConfig',
        type: 'tuple',
      },
      {
        internalType: 'address',
        name: '_xhiftToken',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_creditLetterNFT',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_treasury',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_admin',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'insuranceConfig',
    outputs: [
      {
        internalType: 'bool',
        name: 'insuranceEnabled',
        type: 'bool',
      },
      {
        internalType: 'uint16',
        name: 'insurancePremiumBps',
        type: 'uint16',
      },
      {
        internalType: 'address',
        name: 'insuranceProvider',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'coverageAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'deductible',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'joinPool',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lastCycleTimestamp',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'makeContribution',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'onERC721Received',
    outputs: [
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'participantCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'participantList',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'participants',
    outputs: [
      {
        internalType: 'address',
        name: 'wallet',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'joinedCycle',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'totalContributed',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'missedPayments',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'consecutiveMissedPayments',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lastPaymentCycle',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'hasReceivedSelection',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'selectionCycle',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'isActive',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'reputationScore',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'assignedAssetId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'paymentsCompleted',
        type: 'uint256',
      },
      {
        internalType: 'enum IHousingPoolLLC.MemberStatus',
        name: 'memberStatus',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'penaltyDebt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'cashbackEarned',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'pendingExclusionRefunds',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'poolAssets',
    outputs: [
      {
        internalType: 'string',
        name: 'assetIdentifier',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'purchasePrice',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'acquisitionDate',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'assignedParticipant',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'remainingPayments',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'titleTransferred',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'poolManagement',
    outputs: [
      {
        internalType: 'uint16',
        name: 'managementFeeBps',
        type: 'uint16',
      },
      {
        internalType: 'enum IHousingPoolLLC.FeeChargingScheduleType',
        name: 'chargingSchedule',
        type: 'uint8',
      },
      {
        internalType: 'address',
        name: 'feeCollector',
        type: 'address',
      },
      {
        internalType: 'uint16',
        name: 'performanceFeeBps',
        type: 'uint16',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
    ],
    name: 'removeFromWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'callerConfirmation',
        type: 'address',
      },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'replenishmentActive',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'replenishmentCyclesApplied',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'replenishmentStartCycle',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'requestWithdrawal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserveConfig',
    outputs: [
      {
        internalType: 'uint16',
        name: 'reserveBps',
        type: 'uint16',
      },
      {
        internalType: 'uint16',
        name: 'replenishmentExtraBps',
        type: 'uint16',
      },
      {
        internalType: 'uint8',
        name: 'replenishmentMaxMonths',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'minReserveBalance',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxReserveBalance',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'selectParticipant',
    outputs: [
      {
        internalType: 'address',
        name: 'selected',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'selectedMembers',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'status',
    outputs: [
      {
        internalType: 'enum IHousingPoolLLC.PoolStatus',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalCollected',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalReserveFund',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
    ],
    name: 'transferAssetTitle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'reason',
        type: 'string',
      },
    ],
    name: 'useReserveFund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'whitelist',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'assetId',
        type: 'uint256',
      },
      {
        internalType: 'address payable',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'purpose',
        type: 'string',
      },
    ],
    name: 'withdrawFundsForAsset',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawalRules',
    outputs: [
      {
        internalType: 'bool',
        name: 'withdrawalAllowed',
        type: 'bool',
      },
      {
        internalType: 'uint16',
        name: 'earlyWithdrawalPenaltyBps',
        type: 'uint16',
      },
      {
        internalType: 'uint256',
        name: 'minParticipationMonths',
        type: 'uint256',
      },
      {
        internalType: 'uint16',
        name: 'withdrawalFeeBps',
        type: 'uint16',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'xhiftToken',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
];
