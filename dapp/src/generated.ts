import {
  useContractRead,
  UseContractReadConfig,
  useContractEvent,
  UseContractEventConfig,
  useContractWrite,
  UseContractWriteConfig,
  usePrepareContractWrite,
  UsePrepareContractWriteConfig,
} from "wagmi";
import {
  ReadContractResult,
  WriteContractMode,
  PrepareWriteContractResult,
} from "wagmi/actions";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC165
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc165ABI = [
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Proxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967ProxyABI = [
  {
    stateMutability: "payable",
    type: "constructor",
    inputs: [
      { name: "_logic", internalType: "address", type: "address" },
      { name: "_data", internalType: "bytes", type: "bytes" },
    ],
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousAdmin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "newAdmin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "AdminChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "beacon",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "BeaconUpgraded",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "implementation",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "Upgraded",
  },
  { stateMutability: "payable", type: "fallback" },
  { stateMutability: "payable", type: "receive" },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Upgrade
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967UpgradeABI = [
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousAdmin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "newAdmin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "AdminChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "beacon",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "BeaconUpgraded",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "implementation",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "Upgraded",
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC721
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc721ABI = [
  {
    stateMutability: "nonpayable",
    type: "constructor",
    inputs: [
      { name: "name_", internalType: "string", type: "string" },
      { name: "symbol_", internalType: "string", type: "string" },
    ],
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "approved",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "Approval",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "operator",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      { name: "approved", internalType: "bool", type: "bool", indexed: false },
    ],
    name: "ApprovalForAll",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "from", internalType: "address", type: "address", indexed: true },
      { name: "to", internalType: "address", type: "address", indexed: true },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "Transfer",
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "owner", internalType: "address", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "owner", internalType: "address", type: "address" },
      { name: "operator", internalType: "address", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "name",
    outputs: [{ name: "", internalType: "string", type: "string" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
    ],
    name: "safeTransferFrom",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "operator", internalType: "address", type: "address" },
      { name: "approved", internalType: "bool", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", internalType: "string", type: "string" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", internalType: "string", type: "string" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hololocker
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const hololockerABI = [
  { type: "error", inputs: [], name: "InvalidLockTime" },
  { type: "error", inputs: [], name: "NotUnlockedYet" },
  { type: "error", inputs: [], name: "TokenNotLocked" },
  { type: "error", inputs: [], name: "Unauthorized" },
  { type: "error", inputs: [], name: "UnlockAlreadyRequested" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "token",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "operator",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "Lock",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "newValue",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "LockTimeUpdate",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "newOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "OwnershipTransferred",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "token",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "operator",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "unlockTime",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Unlock",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "token",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "operator",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "Withdraw",
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "MINIMUM_LOCK_TIME",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "token", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "lock",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "lockTime",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
    ],
    name: "nftLockInfo",
    outputs: [
      { name: "unlockTime", internalType: "uint256", type: "uint256" },
      { name: "owner", internalType: "address", type: "address" },
      { name: "operator", internalType: "address", type: "address" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "operator", internalType: "address", type: "address" },
      { name: "from", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "bytes", type: "bytes" },
    ],
    name: "onERC721Received",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "owner",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "token", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "requestUnlock",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "newLockTime", internalType: "uint256", type: "uint256" }],
    name: "setLockTime",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "newOwner", internalType: "address", type: "address" }],
    name: "transferOwnership",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "token", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IBeacon
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iBeaconABI = [
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "implementation",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC165
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc165ABI = [
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC1822Proxiable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc1822ProxiableABI = [
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "proxiableUUID",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC1967
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc1967ABI = [
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousAdmin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "newAdmin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "AdminChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "beacon",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "BeaconUpgraded",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "implementation",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "Upgraded",
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC721
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc721ABI = [
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "approved",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "Approval",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "operator",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      { name: "approved", internalType: "bool", type: "bool", indexed: false },
    ],
    name: "ApprovalForAll",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "from", internalType: "address", type: "address", indexed: true },
      { name: "to", internalType: "address", type: "address", indexed: true },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "Transfer",
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "owner", internalType: "address", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "operator", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "owner", internalType: "address", type: "address" },
      { name: "operator", internalType: "address", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "owner", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
    ],
    name: "safeTransferFrom",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "operator", internalType: "address", type: "address" },
      { name: "approved", internalType: "bool", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC721Metadata
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc721MetadataABI = [
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "approved",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "Approval",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "operator",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      { name: "approved", internalType: "bool", type: "bool", indexed: false },
    ],
    name: "ApprovalForAll",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "from", internalType: "address", type: "address", indexed: true },
      { name: "to", internalType: "address", type: "address", indexed: true },
      {
        name: "tokenId",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "Transfer",
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "owner", internalType: "address", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "operator", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "owner", internalType: "address", type: "address" },
      { name: "operator", internalType: "address", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "name",
    outputs: [{ name: "", internalType: "string", type: "string" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "owner", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
    ],
    name: "safeTransferFrom",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "operator", internalType: "address", type: "address" },
      { name: "approved", internalType: "bool", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", internalType: "string", type: "string" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "tokenId", internalType: "uint256", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", internalType: "string", type: "string" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC721Receiver
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc721ReceiverABI = [
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "operator", internalType: "address", type: "address" },
      { name: "from", internalType: "address", type: "address" },
      { name: "tokenId", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
    ],
    name: "onERC721Received",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMulticall3
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iMulticall3ABI = [
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      {
        name: "calls",
        internalType: "struct IMulticall3.Call[]",
        type: "tuple[]",
        components: [
          { name: "target", internalType: "address", type: "address" },
          { name: "callData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "aggregate",
    outputs: [
      { name: "blockNumber", internalType: "uint256", type: "uint256" },
      { name: "returnData", internalType: "bytes[]", type: "bytes[]" },
    ],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      {
        name: "calls",
        internalType: "struct IMulticall3.Call3[]",
        type: "tuple[]",
        components: [
          { name: "target", internalType: "address", type: "address" },
          { name: "allowFailure", internalType: "bool", type: "bool" },
          { name: "callData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "aggregate3",
    outputs: [
      {
        name: "returnData",
        internalType: "struct IMulticall3.Result[]",
        type: "tuple[]",
        components: [
          { name: "success", internalType: "bool", type: "bool" },
          { name: "returnData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      {
        name: "calls",
        internalType: "struct IMulticall3.Call3Value[]",
        type: "tuple[]",
        components: [
          { name: "target", internalType: "address", type: "address" },
          { name: "allowFailure", internalType: "bool", type: "bool" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "callData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "aggregate3Value",
    outputs: [
      {
        name: "returnData",
        internalType: "struct IMulticall3.Result[]",
        type: "tuple[]",
        components: [
          { name: "success", internalType: "bool", type: "bool" },
          { name: "returnData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      {
        name: "calls",
        internalType: "struct IMulticall3.Call[]",
        type: "tuple[]",
        components: [
          { name: "target", internalType: "address", type: "address" },
          { name: "callData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "blockAndAggregate",
    outputs: [
      { name: "blockNumber", internalType: "uint256", type: "uint256" },
      { name: "blockHash", internalType: "bytes32", type: "bytes32" },
      {
        name: "returnData",
        internalType: "struct IMulticall3.Result[]",
        type: "tuple[]",
        components: [
          { name: "success", internalType: "bool", type: "bool" },
          { name: "returnData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getBasefee",
    outputs: [{ name: "basefee", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "blockNumber", internalType: "uint256", type: "uint256" }],
    name: "getBlockHash",
    outputs: [{ name: "blockHash", internalType: "bytes32", type: "bytes32" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getBlockNumber",
    outputs: [
      { name: "blockNumber", internalType: "uint256", type: "uint256" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getChainId",
    outputs: [{ name: "chainid", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getCurrentBlockCoinbase",
    outputs: [{ name: "coinbase", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getCurrentBlockDifficulty",
    outputs: [{ name: "difficulty", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getCurrentBlockGasLimit",
    outputs: [{ name: "gaslimit", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getCurrentBlockTimestamp",
    outputs: [{ name: "timestamp", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "addr", internalType: "address", type: "address" }],
    name: "getEthBalance",
    outputs: [{ name: "balance", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getLastBlockHash",
    outputs: [{ name: "blockHash", internalType: "bytes32", type: "bytes32" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      { name: "requireSuccess", internalType: "bool", type: "bool" },
      {
        name: "calls",
        internalType: "struct IMulticall3.Call[]",
        type: "tuple[]",
        components: [
          { name: "target", internalType: "address", type: "address" },
          { name: "callData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "tryAggregate",
    outputs: [
      {
        name: "returnData",
        internalType: "struct IMulticall3.Result[]",
        type: "tuple[]",
        components: [
          { name: "success", internalType: "bool", type: "bool" },
          { name: "returnData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      { name: "requireSuccess", internalType: "bool", type: "bool" },
      {
        name: "calls",
        internalType: "struct IMulticall3.Call[]",
        type: "tuple[]",
        components: [
          { name: "target", internalType: "address", type: "address" },
          { name: "callData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "tryBlockAndAggregate",
    outputs: [
      { name: "blockNumber", internalType: "uint256", type: "uint256" },
      { name: "blockHash", internalType: "bytes32", type: "bytes32" },
      {
        name: "returnData",
        internalType: "struct IMulticall3.Result[]",
        type: "tuple[]",
        components: [
          { name: "success", internalType: "bool", type: "bool" },
          { name: "returnData", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ownable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ownableABI = [
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "newOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "OwnershipTransferred",
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "owner",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "newOwner", internalType: "address", type: "address" }],
    name: "transferOwnership",
    outputs: [],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Proxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const proxyABI = [
  { stateMutability: "payable", type: "fallback" },
  { stateMutability: "payable", type: "receive" },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc165ABI}__.
 */
export function useErc165Read<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof erc165ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc165ABI, TFunctionName, TSelectData>,
    "abi"
  > = {} as any,
) {
  return useContractRead({ abi: erc165ABI, ...config } as UseContractReadConfig<
    typeof erc165ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc165ABI}__ and `functionName` set to `"supportsInterface"`.
 */
export function useErc165SupportsInterface<
  TFunctionName extends "supportsInterface",
  TSelectData = ReadContractResult<typeof erc165ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc165ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc165ABI,
    functionName: "supportsInterface",
    ...config,
  } as UseContractReadConfig<typeof erc165ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc1967ProxyABI}__.
 */
export function useErc1967ProxyEvent<TEventName extends string>(
  config: Omit<
    UseContractEventConfig<typeof erc1967ProxyABI, TEventName>,
    "abi"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc1967ProxyABI,
    ...config,
  } as UseContractEventConfig<typeof erc1967ProxyABI, TEventName>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc1967ProxyABI}__ and `eventName` set to `"AdminChanged"`.
 */
export function useErc1967ProxyAdminChangedEvent(
  config: Omit<
    UseContractEventConfig<typeof erc1967ProxyABI, "AdminChanged">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc1967ProxyABI,
    eventName: "AdminChanged",
    ...config,
  } as UseContractEventConfig<typeof erc1967ProxyABI, "AdminChanged">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc1967ProxyABI}__ and `eventName` set to `"BeaconUpgraded"`.
 */
export function useErc1967ProxyBeaconUpgradedEvent(
  config: Omit<
    UseContractEventConfig<typeof erc1967ProxyABI, "BeaconUpgraded">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc1967ProxyABI,
    eventName: "BeaconUpgraded",
    ...config,
  } as UseContractEventConfig<typeof erc1967ProxyABI, "BeaconUpgraded">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc1967ProxyABI}__ and `eventName` set to `"Upgraded"`.
 */
export function useErc1967ProxyUpgradedEvent(
  config: Omit<
    UseContractEventConfig<typeof erc1967ProxyABI, "Upgraded">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc1967ProxyABI,
    eventName: "Upgraded",
    ...config,
  } as UseContractEventConfig<typeof erc1967ProxyABI, "Upgraded">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc1967UpgradeABI}__.
 */
export function useErc1967UpgradeEvent<TEventName extends string>(
  config: Omit<
    UseContractEventConfig<typeof erc1967UpgradeABI, TEventName>,
    "abi"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc1967UpgradeABI,
    ...config,
  } as UseContractEventConfig<typeof erc1967UpgradeABI, TEventName>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc1967UpgradeABI}__ and `eventName` set to `"AdminChanged"`.
 */
export function useErc1967UpgradeAdminChangedEvent(
  config: Omit<
    UseContractEventConfig<typeof erc1967UpgradeABI, "AdminChanged">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc1967UpgradeABI,
    eventName: "AdminChanged",
    ...config,
  } as UseContractEventConfig<typeof erc1967UpgradeABI, "AdminChanged">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc1967UpgradeABI}__ and `eventName` set to `"BeaconUpgraded"`.
 */
export function useErc1967UpgradeBeaconUpgradedEvent(
  config: Omit<
    UseContractEventConfig<typeof erc1967UpgradeABI, "BeaconUpgraded">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc1967UpgradeABI,
    eventName: "BeaconUpgraded",
    ...config,
  } as UseContractEventConfig<typeof erc1967UpgradeABI, "BeaconUpgraded">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc1967UpgradeABI}__ and `eventName` set to `"Upgraded"`.
 */
export function useErc1967UpgradeUpgradedEvent(
  config: Omit<
    UseContractEventConfig<typeof erc1967UpgradeABI, "Upgraded">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc1967UpgradeABI,
    eventName: "Upgraded",
    ...config,
  } as UseContractEventConfig<typeof erc1967UpgradeABI, "Upgraded">);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__.
 */
export function useErc721Read<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi"
  > = {} as any,
) {
  return useContractRead({ abi: erc721ABI, ...config } as UseContractReadConfig<
    typeof erc721ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"balanceOf"`.
 */
export function useErc721BalanceOf<
  TFunctionName extends "balanceOf",
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc721ABI,
    functionName: "balanceOf",
    ...config,
  } as UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"getApproved"`.
 */
export function useErc721GetApproved<
  TFunctionName extends "getApproved",
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc721ABI,
    functionName: "getApproved",
    ...config,
  } as UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"isApprovedForAll"`.
 */
export function useErc721IsApprovedForAll<
  TFunctionName extends "isApprovedForAll",
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc721ABI,
    functionName: "isApprovedForAll",
    ...config,
  } as UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"name"`.
 */
export function useErc721Name<
  TFunctionName extends "name",
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc721ABI,
    functionName: "name",
    ...config,
  } as UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"ownerOf"`.
 */
export function useErc721OwnerOf<
  TFunctionName extends "ownerOf",
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc721ABI,
    functionName: "ownerOf",
    ...config,
  } as UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"supportsInterface"`.
 */
export function useErc721SupportsInterface<
  TFunctionName extends "supportsInterface",
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc721ABI,
    functionName: "supportsInterface",
    ...config,
  } as UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"symbol"`.
 */
export function useErc721Symbol<
  TFunctionName extends "symbol",
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc721ABI,
    functionName: "symbol",
    ...config,
  } as UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"tokenURI"`.
 */
export function useErc721TokenUri<
  TFunctionName extends "tokenURI",
  TSelectData = ReadContractResult<typeof erc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: erc721ABI,
    functionName: "tokenURI",
    ...config,
  } as UseContractReadConfig<typeof erc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link erc721ABI}__.
 */
export function useErc721Write<
  TFunctionName extends string,
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<typeof erc721ABI, string>["request"]["abi"],
        TFunctionName,
        TMode
      >
    : UseContractWriteConfig<typeof erc721ABI, TFunctionName, TMode> & {
        abi?: never;
      } = {} as any,
) {
  return useContractWrite<typeof erc721ABI, TFunctionName, TMode>({
    abi: erc721ABI,
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"approve"`.
 */
export function useErc721Approve<TMode extends WriteContractMode = undefined>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof erc721ABI,
          "approve"
        >["request"]["abi"],
        "approve",
        TMode
      > & { functionName?: "approve" }
    : UseContractWriteConfig<typeof erc721ABI, "approve", TMode> & {
        abi?: never;
        functionName?: "approve";
      } = {} as any,
) {
  return useContractWrite<typeof erc721ABI, "approve", TMode>({
    abi: erc721ABI,
    functionName: "approve",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"safeTransferFrom"`.
 */
export function useErc721SafeTransferFrom<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof erc721ABI,
          "safeTransferFrom"
        >["request"]["abi"],
        "safeTransferFrom",
        TMode
      > & { functionName?: "safeTransferFrom" }
    : UseContractWriteConfig<typeof erc721ABI, "safeTransferFrom", TMode> & {
        abi?: never;
        functionName?: "safeTransferFrom";
      } = {} as any,
) {
  return useContractWrite<typeof erc721ABI, "safeTransferFrom", TMode>({
    abi: erc721ABI,
    functionName: "safeTransferFrom",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"setApprovalForAll"`.
 */
export function useErc721SetApprovalForAll<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof erc721ABI,
          "setApprovalForAll"
        >["request"]["abi"],
        "setApprovalForAll",
        TMode
      > & { functionName?: "setApprovalForAll" }
    : UseContractWriteConfig<typeof erc721ABI, "setApprovalForAll", TMode> & {
        abi?: never;
        functionName?: "setApprovalForAll";
      } = {} as any,
) {
  return useContractWrite<typeof erc721ABI, "setApprovalForAll", TMode>({
    abi: erc721ABI,
    functionName: "setApprovalForAll",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"transferFrom"`.
 */
export function useErc721TransferFrom<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof erc721ABI,
          "transferFrom"
        >["request"]["abi"],
        "transferFrom",
        TMode
      > & { functionName?: "transferFrom" }
    : UseContractWriteConfig<typeof erc721ABI, "transferFrom", TMode> & {
        abi?: never;
        functionName?: "transferFrom";
      } = {} as any,
) {
  return useContractWrite<typeof erc721ABI, "transferFrom", TMode>({
    abi: erc721ABI,
    functionName: "transferFrom",
    ...config,
  } as any);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link erc721ABI}__.
 */
export function usePrepareErc721Write<TFunctionName extends string>(
  config: Omit<
    UsePrepareContractWriteConfig<typeof erc721ABI, TFunctionName>,
    "abi"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: erc721ABI,
    ...config,
  } as UsePrepareContractWriteConfig<typeof erc721ABI, TFunctionName>);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"approve"`.
 */
export function usePrepareErc721Approve(
  config: Omit<
    UsePrepareContractWriteConfig<typeof erc721ABI, "approve">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: erc721ABI,
    functionName: "approve",
    ...config,
  } as UsePrepareContractWriteConfig<typeof erc721ABI, "approve">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"safeTransferFrom"`.
 */
export function usePrepareErc721SafeTransferFrom(
  config: Omit<
    UsePrepareContractWriteConfig<typeof erc721ABI, "safeTransferFrom">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: erc721ABI,
    functionName: "safeTransferFrom",
    ...config,
  } as UsePrepareContractWriteConfig<typeof erc721ABI, "safeTransferFrom">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"setApprovalForAll"`.
 */
export function usePrepareErc721SetApprovalForAll(
  config: Omit<
    UsePrepareContractWriteConfig<typeof erc721ABI, "setApprovalForAll">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: erc721ABI,
    functionName: "setApprovalForAll",
    ...config,
  } as UsePrepareContractWriteConfig<typeof erc721ABI, "setApprovalForAll">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link erc721ABI}__ and `functionName` set to `"transferFrom"`.
 */
export function usePrepareErc721TransferFrom(
  config: Omit<
    UsePrepareContractWriteConfig<typeof erc721ABI, "transferFrom">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: erc721ABI,
    functionName: "transferFrom",
    ...config,
  } as UsePrepareContractWriteConfig<typeof erc721ABI, "transferFrom">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc721ABI}__.
 */
export function useErc721Event<TEventName extends string>(
  config: Omit<
    UseContractEventConfig<typeof erc721ABI, TEventName>,
    "abi"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc721ABI,
    ...config,
  } as UseContractEventConfig<typeof erc721ABI, TEventName>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc721ABI}__ and `eventName` set to `"Approval"`.
 */
export function useErc721ApprovalEvent(
  config: Omit<
    UseContractEventConfig<typeof erc721ABI, "Approval">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc721ABI,
    eventName: "Approval",
    ...config,
  } as UseContractEventConfig<typeof erc721ABI, "Approval">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc721ABI}__ and `eventName` set to `"ApprovalForAll"`.
 */
export function useErc721ApprovalForAllEvent(
  config: Omit<
    UseContractEventConfig<typeof erc721ABI, "ApprovalForAll">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc721ABI,
    eventName: "ApprovalForAll",
    ...config,
  } as UseContractEventConfig<typeof erc721ABI, "ApprovalForAll">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link erc721ABI}__ and `eventName` set to `"Transfer"`.
 */
export function useErc721TransferEvent(
  config: Omit<
    UseContractEventConfig<typeof erc721ABI, "Transfer">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: erc721ABI,
    eventName: "Transfer",
    ...config,
  } as UseContractEventConfig<typeof erc721ABI, "Transfer">);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link hololockerABI}__.
 */
export function useHololockerRead<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof hololockerABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>,
    "abi"
  > = {} as any,
) {
  return useContractRead({
    abi: hololockerABI,
    ...config,
  } as UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"MINIMUM_LOCK_TIME"`.
 */
export function useHololockerMinimumLockTime<
  TFunctionName extends "MINIMUM_LOCK_TIME",
  TSelectData = ReadContractResult<typeof hololockerABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: hololockerABI,
    functionName: "MINIMUM_LOCK_TIME",
    ...config,
  } as UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"lockTime"`.
 */
export function useHololockerLockTime<
  TFunctionName extends "lockTime",
  TSelectData = ReadContractResult<typeof hololockerABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: hololockerABI,
    functionName: "lockTime",
    ...config,
  } as UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"nftLockInfo"`.
 */
export function useHololockerNftLockInfo<
  TFunctionName extends "nftLockInfo",
  TSelectData = ReadContractResult<typeof hololockerABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: hololockerABI,
    functionName: "nftLockInfo",
    ...config,
  } as UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"owner"`.
 */
export function useHololockerOwner<
  TFunctionName extends "owner",
  TSelectData = ReadContractResult<typeof hololockerABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: hololockerABI,
    functionName: "owner",
    ...config,
  } as UseContractReadConfig<typeof hololockerABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link hololockerABI}__.
 */
export function useHololockerWrite<
  TFunctionName extends string,
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof hololockerABI,
          string
        >["request"]["abi"],
        TFunctionName,
        TMode
      >
    : UseContractWriteConfig<typeof hololockerABI, TFunctionName, TMode> & {
        abi?: never;
      } = {} as any,
) {
  return useContractWrite<typeof hololockerABI, TFunctionName, TMode>({
    abi: hololockerABI,
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"lock"`.
 */
export function useHololockerLock<TMode extends WriteContractMode = undefined>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof hololockerABI,
          "lock"
        >["request"]["abi"],
        "lock",
        TMode
      > & { functionName?: "lock" }
    : UseContractWriteConfig<typeof hololockerABI, "lock", TMode> & {
        abi?: never;
        functionName?: "lock";
      } = {} as any,
) {
  return useContractWrite<typeof hololockerABI, "lock", TMode>({
    abi: hololockerABI,
    functionName: "lock",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"onERC721Received"`.
 */
export function useHololockerOnErc721Received<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof hololockerABI,
          "onERC721Received"
        >["request"]["abi"],
        "onERC721Received",
        TMode
      > & { functionName?: "onERC721Received" }
    : UseContractWriteConfig<
        typeof hololockerABI,
        "onERC721Received",
        TMode
      > & {
        abi?: never;
        functionName?: "onERC721Received";
      } = {} as any,
) {
  return useContractWrite<typeof hololockerABI, "onERC721Received", TMode>({
    abi: hololockerABI,
    functionName: "onERC721Received",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"renounceOwnership"`.
 */
export function useHololockerRenounceOwnership<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof hololockerABI,
          "renounceOwnership"
        >["request"]["abi"],
        "renounceOwnership",
        TMode
      > & { functionName?: "renounceOwnership" }
    : UseContractWriteConfig<
        typeof hololockerABI,
        "renounceOwnership",
        TMode
      > & {
        abi?: never;
        functionName?: "renounceOwnership";
      } = {} as any,
) {
  return useContractWrite<typeof hololockerABI, "renounceOwnership", TMode>({
    abi: hololockerABI,
    functionName: "renounceOwnership",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"requestUnlock"`.
 */
export function useHololockerRequestUnlock<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof hololockerABI,
          "requestUnlock"
        >["request"]["abi"],
        "requestUnlock",
        TMode
      > & { functionName?: "requestUnlock" }
    : UseContractWriteConfig<typeof hololockerABI, "requestUnlock", TMode> & {
        abi?: never;
        functionName?: "requestUnlock";
      } = {} as any,
) {
  return useContractWrite<typeof hololockerABI, "requestUnlock", TMode>({
    abi: hololockerABI,
    functionName: "requestUnlock",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"setLockTime"`.
 */
export function useHololockerSetLockTime<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof hololockerABI,
          "setLockTime"
        >["request"]["abi"],
        "setLockTime",
        TMode
      > & { functionName?: "setLockTime" }
    : UseContractWriteConfig<typeof hololockerABI, "setLockTime", TMode> & {
        abi?: never;
        functionName?: "setLockTime";
      } = {} as any,
) {
  return useContractWrite<typeof hololockerABI, "setLockTime", TMode>({
    abi: hololockerABI,
    functionName: "setLockTime",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"transferOwnership"`.
 */
export function useHololockerTransferOwnership<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof hololockerABI,
          "transferOwnership"
        >["request"]["abi"],
        "transferOwnership",
        TMode
      > & { functionName?: "transferOwnership" }
    : UseContractWriteConfig<
        typeof hololockerABI,
        "transferOwnership",
        TMode
      > & {
        abi?: never;
        functionName?: "transferOwnership";
      } = {} as any,
) {
  return useContractWrite<typeof hololockerABI, "transferOwnership", TMode>({
    abi: hololockerABI,
    functionName: "transferOwnership",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"withdraw"`.
 */
export function useHololockerWithdraw<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof hololockerABI,
          "withdraw"
        >["request"]["abi"],
        "withdraw",
        TMode
      > & { functionName?: "withdraw" }
    : UseContractWriteConfig<typeof hololockerABI, "withdraw", TMode> & {
        abi?: never;
        functionName?: "withdraw";
      } = {} as any,
) {
  return useContractWrite<typeof hololockerABI, "withdraw", TMode>({
    abi: hololockerABI,
    functionName: "withdraw",
    ...config,
  } as any);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link hololockerABI}__.
 */
export function usePrepareHololockerWrite<TFunctionName extends string>(
  config: Omit<
    UsePrepareContractWriteConfig<typeof hololockerABI, TFunctionName>,
    "abi"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: hololockerABI,
    ...config,
  } as UsePrepareContractWriteConfig<typeof hololockerABI, TFunctionName>);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"lock"`.
 */
export function usePrepareHololockerLock(
  config: Omit<
    UsePrepareContractWriteConfig<typeof hololockerABI, "lock">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: hololockerABI,
    functionName: "lock",
    ...config,
  } as UsePrepareContractWriteConfig<typeof hololockerABI, "lock">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"onERC721Received"`.
 */
export function usePrepareHololockerOnErc721Received(
  config: Omit<
    UsePrepareContractWriteConfig<typeof hololockerABI, "onERC721Received">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: hololockerABI,
    functionName: "onERC721Received",
    ...config,
  } as UsePrepareContractWriteConfig<typeof hololockerABI, "onERC721Received">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"renounceOwnership"`.
 */
export function usePrepareHololockerRenounceOwnership(
  config: Omit<
    UsePrepareContractWriteConfig<typeof hololockerABI, "renounceOwnership">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: hololockerABI,
    functionName: "renounceOwnership",
    ...config,
  } as UsePrepareContractWriteConfig<
    typeof hololockerABI,
    "renounceOwnership"
  >);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"requestUnlock"`.
 */
export function usePrepareHololockerRequestUnlock(
  config: Omit<
    UsePrepareContractWriteConfig<typeof hololockerABI, "requestUnlock">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: hololockerABI,
    functionName: "requestUnlock",
    ...config,
  } as UsePrepareContractWriteConfig<typeof hololockerABI, "requestUnlock">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"setLockTime"`.
 */
export function usePrepareHololockerSetLockTime(
  config: Omit<
    UsePrepareContractWriteConfig<typeof hololockerABI, "setLockTime">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: hololockerABI,
    functionName: "setLockTime",
    ...config,
  } as UsePrepareContractWriteConfig<typeof hololockerABI, "setLockTime">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"transferOwnership"`.
 */
export function usePrepareHololockerTransferOwnership(
  config: Omit<
    UsePrepareContractWriteConfig<typeof hololockerABI, "transferOwnership">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: hololockerABI,
    functionName: "transferOwnership",
    ...config,
  } as UsePrepareContractWriteConfig<
    typeof hololockerABI,
    "transferOwnership"
  >);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link hololockerABI}__ and `functionName` set to `"withdraw"`.
 */
export function usePrepareHololockerWithdraw(
  config: Omit<
    UsePrepareContractWriteConfig<typeof hololockerABI, "withdraw">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: hololockerABI,
    functionName: "withdraw",
    ...config,
  } as UsePrepareContractWriteConfig<typeof hololockerABI, "withdraw">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link hololockerABI}__.
 */
export function useHololockerEvent<TEventName extends string>(
  config: Omit<
    UseContractEventConfig<typeof hololockerABI, TEventName>,
    "abi"
  > = {} as any,
) {
  return useContractEvent({
    abi: hololockerABI,
    ...config,
  } as UseContractEventConfig<typeof hololockerABI, TEventName>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link hololockerABI}__ and `eventName` set to `"Lock"`.
 */
export function useHololockerLockEvent(
  config: Omit<
    UseContractEventConfig<typeof hololockerABI, "Lock">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: hololockerABI,
    eventName: "Lock",
    ...config,
  } as UseContractEventConfig<typeof hololockerABI, "Lock">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link hololockerABI}__ and `eventName` set to `"LockTimeUpdate"`.
 */
export function useHololockerLockTimeUpdateEvent(
  config: Omit<
    UseContractEventConfig<typeof hololockerABI, "LockTimeUpdate">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: hololockerABI,
    eventName: "LockTimeUpdate",
    ...config,
  } as UseContractEventConfig<typeof hololockerABI, "LockTimeUpdate">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link hololockerABI}__ and `eventName` set to `"OwnershipTransferred"`.
 */
export function useHololockerOwnershipTransferredEvent(
  config: Omit<
    UseContractEventConfig<typeof hololockerABI, "OwnershipTransferred">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: hololockerABI,
    eventName: "OwnershipTransferred",
    ...config,
  } as UseContractEventConfig<typeof hololockerABI, "OwnershipTransferred">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link hololockerABI}__ and `eventName` set to `"Unlock"`.
 */
export function useHololockerUnlockEvent(
  config: Omit<
    UseContractEventConfig<typeof hololockerABI, "Unlock">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: hololockerABI,
    eventName: "Unlock",
    ...config,
  } as UseContractEventConfig<typeof hololockerABI, "Unlock">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link hololockerABI}__ and `eventName` set to `"Withdraw"`.
 */
export function useHololockerWithdrawEvent(
  config: Omit<
    UseContractEventConfig<typeof hololockerABI, "Withdraw">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: hololockerABI,
    eventName: "Withdraw",
    ...config,
  } as UseContractEventConfig<typeof hololockerABI, "Withdraw">);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iBeaconABI}__.
 */
export function useIBeaconRead<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof iBeaconABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iBeaconABI, TFunctionName, TSelectData>,
    "abi"
  > = {} as any,
) {
  return useContractRead({
    abi: iBeaconABI,
    ...config,
  } as UseContractReadConfig<typeof iBeaconABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iBeaconABI}__ and `functionName` set to `"implementation"`.
 */
export function useIBeaconImplementation<
  TFunctionName extends "implementation",
  TSelectData = ReadContractResult<typeof iBeaconABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iBeaconABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iBeaconABI,
    functionName: "implementation",
    ...config,
  } as UseContractReadConfig<typeof iBeaconABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc165ABI}__.
 */
export function useIerc165Read<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof ierc165ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ierc165ABI, TFunctionName, TSelectData>,
    "abi"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc165ABI,
    ...config,
  } as UseContractReadConfig<typeof ierc165ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc165ABI}__ and `functionName` set to `"supportsInterface"`.
 */
export function useIerc165SupportsInterface<
  TFunctionName extends "supportsInterface",
  TSelectData = ReadContractResult<typeof ierc165ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ierc165ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc165ABI,
    functionName: "supportsInterface",
    ...config,
  } as UseContractReadConfig<typeof ierc165ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc1822ProxiableABI}__.
 */
export function useIerc1822ProxiableRead<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof ierc1822ProxiableABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc1822ProxiableABI,
      TFunctionName,
      TSelectData
    >,
    "abi"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc1822ProxiableABI,
    ...config,
  } as UseContractReadConfig<
    typeof ierc1822ProxiableABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc1822ProxiableABI}__ and `functionName` set to `"proxiableUUID"`.
 */
export function useIerc1822ProxiableProxiableUuid<
  TFunctionName extends "proxiableUUID",
  TSelectData = ReadContractResult<typeof ierc1822ProxiableABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc1822ProxiableABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc1822ProxiableABI,
    functionName: "proxiableUUID",
    ...config,
  } as UseContractReadConfig<
    typeof ierc1822ProxiableABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc1967ABI}__.
 */
export function useIerc1967Event<TEventName extends string>(
  config: Omit<
    UseContractEventConfig<typeof ierc1967ABI, TEventName>,
    "abi"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc1967ABI,
    ...config,
  } as UseContractEventConfig<typeof ierc1967ABI, TEventName>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc1967ABI}__ and `eventName` set to `"AdminChanged"`.
 */
export function useIerc1967AdminChangedEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc1967ABI, "AdminChanged">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc1967ABI,
    eventName: "AdminChanged",
    ...config,
  } as UseContractEventConfig<typeof ierc1967ABI, "AdminChanged">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc1967ABI}__ and `eventName` set to `"BeaconUpgraded"`.
 */
export function useIerc1967BeaconUpgradedEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc1967ABI, "BeaconUpgraded">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc1967ABI,
    eventName: "BeaconUpgraded",
    ...config,
  } as UseContractEventConfig<typeof ierc1967ABI, "BeaconUpgraded">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc1967ABI}__ and `eventName` set to `"Upgraded"`.
 */
export function useIerc1967UpgradedEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc1967ABI, "Upgraded">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc1967ABI,
    eventName: "Upgraded",
    ...config,
  } as UseContractEventConfig<typeof ierc1967ABI, "Upgraded">);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721ABI}__.
 */
export function useIerc721Read<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof ierc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>,
    "abi"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721ABI,
    ...config,
  } as UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"balanceOf"`.
 */
export function useIerc721BalanceOf<
  TFunctionName extends "balanceOf",
  TSelectData = ReadContractResult<typeof ierc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721ABI,
    functionName: "balanceOf",
    ...config,
  } as UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"getApproved"`.
 */
export function useIerc721GetApproved<
  TFunctionName extends "getApproved",
  TSelectData = ReadContractResult<typeof ierc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721ABI,
    functionName: "getApproved",
    ...config,
  } as UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"isApprovedForAll"`.
 */
export function useIerc721IsApprovedForAll<
  TFunctionName extends "isApprovedForAll",
  TSelectData = ReadContractResult<typeof ierc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721ABI,
    functionName: "isApprovedForAll",
    ...config,
  } as UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"ownerOf"`.
 */
export function useIerc721OwnerOf<
  TFunctionName extends "ownerOf",
  TSelectData = ReadContractResult<typeof ierc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721ABI,
    functionName: "ownerOf",
    ...config,
  } as UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"supportsInterface"`.
 */
export function useIerc721SupportsInterface<
  TFunctionName extends "supportsInterface",
  TSelectData = ReadContractResult<typeof ierc721ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721ABI,
    functionName: "supportsInterface",
    ...config,
  } as UseContractReadConfig<typeof ierc721ABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721ABI}__.
 */
export function useIerc721Write<
  TFunctionName extends string,
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<typeof ierc721ABI, string>["request"]["abi"],
        TFunctionName,
        TMode
      >
    : UseContractWriteConfig<typeof ierc721ABI, TFunctionName, TMode> & {
        abi?: never;
      } = {} as any,
) {
  return useContractWrite<typeof ierc721ABI, TFunctionName, TMode>({
    abi: ierc721ABI,
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"approve"`.
 */
export function useIerc721Approve<TMode extends WriteContractMode = undefined>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721ABI,
          "approve"
        >["request"]["abi"],
        "approve",
        TMode
      > & { functionName?: "approve" }
    : UseContractWriteConfig<typeof ierc721ABI, "approve", TMode> & {
        abi?: never;
        functionName?: "approve";
      } = {} as any,
) {
  return useContractWrite<typeof ierc721ABI, "approve", TMode>({
    abi: ierc721ABI,
    functionName: "approve",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"safeTransferFrom"`.
 */
export function useIerc721SafeTransferFrom<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721ABI,
          "safeTransferFrom"
        >["request"]["abi"],
        "safeTransferFrom",
        TMode
      > & { functionName?: "safeTransferFrom" }
    : UseContractWriteConfig<typeof ierc721ABI, "safeTransferFrom", TMode> & {
        abi?: never;
        functionName?: "safeTransferFrom";
      } = {} as any,
) {
  return useContractWrite<typeof ierc721ABI, "safeTransferFrom", TMode>({
    abi: ierc721ABI,
    functionName: "safeTransferFrom",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"setApprovalForAll"`.
 */
export function useIerc721SetApprovalForAll<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721ABI,
          "setApprovalForAll"
        >["request"]["abi"],
        "setApprovalForAll",
        TMode
      > & { functionName?: "setApprovalForAll" }
    : UseContractWriteConfig<typeof ierc721ABI, "setApprovalForAll", TMode> & {
        abi?: never;
        functionName?: "setApprovalForAll";
      } = {} as any,
) {
  return useContractWrite<typeof ierc721ABI, "setApprovalForAll", TMode>({
    abi: ierc721ABI,
    functionName: "setApprovalForAll",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"transferFrom"`.
 */
export function useIerc721TransferFrom<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721ABI,
          "transferFrom"
        >["request"]["abi"],
        "transferFrom",
        TMode
      > & { functionName?: "transferFrom" }
    : UseContractWriteConfig<typeof ierc721ABI, "transferFrom", TMode> & {
        abi?: never;
        functionName?: "transferFrom";
      } = {} as any,
) {
  return useContractWrite<typeof ierc721ABI, "transferFrom", TMode>({
    abi: ierc721ABI,
    functionName: "transferFrom",
    ...config,
  } as any);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721ABI}__.
 */
export function usePrepareIerc721Write<TFunctionName extends string>(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721ABI, TFunctionName>,
    "abi"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721ABI,
    ...config,
  } as UsePrepareContractWriteConfig<typeof ierc721ABI, TFunctionName>);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"approve"`.
 */
export function usePrepareIerc721Approve(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721ABI, "approve">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721ABI,
    functionName: "approve",
    ...config,
  } as UsePrepareContractWriteConfig<typeof ierc721ABI, "approve">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"safeTransferFrom"`.
 */
export function usePrepareIerc721SafeTransferFrom(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721ABI, "safeTransferFrom">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721ABI,
    functionName: "safeTransferFrom",
    ...config,
  } as UsePrepareContractWriteConfig<typeof ierc721ABI, "safeTransferFrom">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"setApprovalForAll"`.
 */
export function usePrepareIerc721SetApprovalForAll(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721ABI, "setApprovalForAll">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721ABI,
    functionName: "setApprovalForAll",
    ...config,
  } as UsePrepareContractWriteConfig<typeof ierc721ABI, "setApprovalForAll">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721ABI}__ and `functionName` set to `"transferFrom"`.
 */
export function usePrepareIerc721TransferFrom(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721ABI, "transferFrom">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721ABI,
    functionName: "transferFrom",
    ...config,
  } as UsePrepareContractWriteConfig<typeof ierc721ABI, "transferFrom">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc721ABI}__.
 */
export function useIerc721Event<TEventName extends string>(
  config: Omit<
    UseContractEventConfig<typeof ierc721ABI, TEventName>,
    "abi"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc721ABI,
    ...config,
  } as UseContractEventConfig<typeof ierc721ABI, TEventName>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc721ABI}__ and `eventName` set to `"Approval"`.
 */
export function useIerc721ApprovalEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc721ABI, "Approval">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc721ABI,
    eventName: "Approval",
    ...config,
  } as UseContractEventConfig<typeof ierc721ABI, "Approval">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc721ABI}__ and `eventName` set to `"ApprovalForAll"`.
 */
export function useIerc721ApprovalForAllEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc721ABI, "ApprovalForAll">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc721ABI,
    eventName: "ApprovalForAll",
    ...config,
  } as UseContractEventConfig<typeof ierc721ABI, "ApprovalForAll">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc721ABI}__ and `eventName` set to `"Transfer"`.
 */
export function useIerc721TransferEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc721ABI, "Transfer">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc721ABI,
    eventName: "Transfer",
    ...config,
  } as UseContractEventConfig<typeof ierc721ABI, "Transfer">);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__.
 */
export function useIerc721MetadataRead<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"balanceOf"`.
 */
export function useIerc721MetadataBalanceOf<
  TFunctionName extends "balanceOf",
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    functionName: "balanceOf",
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"getApproved"`.
 */
export function useIerc721MetadataGetApproved<
  TFunctionName extends "getApproved",
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    functionName: "getApproved",
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"isApprovedForAll"`.
 */
export function useIerc721MetadataIsApprovedForAll<
  TFunctionName extends "isApprovedForAll",
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    functionName: "isApprovedForAll",
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"name"`.
 */
export function useIerc721MetadataName<
  TFunctionName extends "name",
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    functionName: "name",
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"ownerOf"`.
 */
export function useIerc721MetadataOwnerOf<
  TFunctionName extends "ownerOf",
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    functionName: "ownerOf",
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"supportsInterface"`.
 */
export function useIerc721MetadataSupportsInterface<
  TFunctionName extends "supportsInterface",
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    functionName: "supportsInterface",
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"symbol"`.
 */
export function useIerc721MetadataSymbol<
  TFunctionName extends "symbol",
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    functionName: "symbol",
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"tokenURI"`.
 */
export function useIerc721MetadataTokenUri<
  TFunctionName extends "tokenURI",
  TSelectData = ReadContractResult<typeof ierc721MetadataABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<
      typeof ierc721MetadataABI,
      TFunctionName,
      TSelectData
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ierc721MetadataABI,
    functionName: "tokenURI",
    ...config,
  } as UseContractReadConfig<
    typeof ierc721MetadataABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__.
 */
export function useIerc721MetadataWrite<
  TFunctionName extends string,
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721MetadataABI,
          string
        >["request"]["abi"],
        TFunctionName,
        TMode
      >
    : UseContractWriteConfig<
        typeof ierc721MetadataABI,
        TFunctionName,
        TMode
      > & {
        abi?: never;
      } = {} as any,
) {
  return useContractWrite<typeof ierc721MetadataABI, TFunctionName, TMode>({
    abi: ierc721MetadataABI,
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"approve"`.
 */
export function useIerc721MetadataApprove<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721MetadataABI,
          "approve"
        >["request"]["abi"],
        "approve",
        TMode
      > & { functionName?: "approve" }
    : UseContractWriteConfig<typeof ierc721MetadataABI, "approve", TMode> & {
        abi?: never;
        functionName?: "approve";
      } = {} as any,
) {
  return useContractWrite<typeof ierc721MetadataABI, "approve", TMode>({
    abi: ierc721MetadataABI,
    functionName: "approve",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"safeTransferFrom"`.
 */
export function useIerc721MetadataSafeTransferFrom<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721MetadataABI,
          "safeTransferFrom"
        >["request"]["abi"],
        "safeTransferFrom",
        TMode
      > & { functionName?: "safeTransferFrom" }
    : UseContractWriteConfig<
        typeof ierc721MetadataABI,
        "safeTransferFrom",
        TMode
      > & {
        abi?: never;
        functionName?: "safeTransferFrom";
      } = {} as any,
) {
  return useContractWrite<typeof ierc721MetadataABI, "safeTransferFrom", TMode>(
    {
      abi: ierc721MetadataABI,
      functionName: "safeTransferFrom",
      ...config,
    } as any,
  );
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"setApprovalForAll"`.
 */
export function useIerc721MetadataSetApprovalForAll<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721MetadataABI,
          "setApprovalForAll"
        >["request"]["abi"],
        "setApprovalForAll",
        TMode
      > & { functionName?: "setApprovalForAll" }
    : UseContractWriteConfig<
        typeof ierc721MetadataABI,
        "setApprovalForAll",
        TMode
      > & {
        abi?: never;
        functionName?: "setApprovalForAll";
      } = {} as any,
) {
  return useContractWrite<
    typeof ierc721MetadataABI,
    "setApprovalForAll",
    TMode
  >({
    abi: ierc721MetadataABI,
    functionName: "setApprovalForAll",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"transferFrom"`.
 */
export function useIerc721MetadataTransferFrom<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721MetadataABI,
          "transferFrom"
        >["request"]["abi"],
        "transferFrom",
        TMode
      > & { functionName?: "transferFrom" }
    : UseContractWriteConfig<
        typeof ierc721MetadataABI,
        "transferFrom",
        TMode
      > & {
        abi?: never;
        functionName?: "transferFrom";
      } = {} as any,
) {
  return useContractWrite<typeof ierc721MetadataABI, "transferFrom", TMode>({
    abi: ierc721MetadataABI,
    functionName: "transferFrom",
    ...config,
  } as any);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__.
 */
export function usePrepareIerc721MetadataWrite<TFunctionName extends string>(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721MetadataABI, TFunctionName>,
    "abi"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721MetadataABI,
    ...config,
  } as UsePrepareContractWriteConfig<typeof ierc721MetadataABI, TFunctionName>);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"approve"`.
 */
export function usePrepareIerc721MetadataApprove(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721MetadataABI, "approve">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721MetadataABI,
    functionName: "approve",
    ...config,
  } as UsePrepareContractWriteConfig<typeof ierc721MetadataABI, "approve">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"safeTransferFrom"`.
 */
export function usePrepareIerc721MetadataSafeTransferFrom(
  config: Omit<
    UsePrepareContractWriteConfig<
      typeof ierc721MetadataABI,
      "safeTransferFrom"
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721MetadataABI,
    functionName: "safeTransferFrom",
    ...config,
  } as UsePrepareContractWriteConfig<
    typeof ierc721MetadataABI,
    "safeTransferFrom"
  >);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"setApprovalForAll"`.
 */
export function usePrepareIerc721MetadataSetApprovalForAll(
  config: Omit<
    UsePrepareContractWriteConfig<
      typeof ierc721MetadataABI,
      "setApprovalForAll"
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721MetadataABI,
    functionName: "setApprovalForAll",
    ...config,
  } as UsePrepareContractWriteConfig<
    typeof ierc721MetadataABI,
    "setApprovalForAll"
  >);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721MetadataABI}__ and `functionName` set to `"transferFrom"`.
 */
export function usePrepareIerc721MetadataTransferFrom(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721MetadataABI, "transferFrom">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721MetadataABI,
    functionName: "transferFrom",
    ...config,
  } as UsePrepareContractWriteConfig<
    typeof ierc721MetadataABI,
    "transferFrom"
  >);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc721MetadataABI}__.
 */
export function useIerc721MetadataEvent<TEventName extends string>(
  config: Omit<
    UseContractEventConfig<typeof ierc721MetadataABI, TEventName>,
    "abi"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc721MetadataABI,
    ...config,
  } as UseContractEventConfig<typeof ierc721MetadataABI, TEventName>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc721MetadataABI}__ and `eventName` set to `"Approval"`.
 */
export function useIerc721MetadataApprovalEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc721MetadataABI, "Approval">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc721MetadataABI,
    eventName: "Approval",
    ...config,
  } as UseContractEventConfig<typeof ierc721MetadataABI, "Approval">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc721MetadataABI}__ and `eventName` set to `"ApprovalForAll"`.
 */
export function useIerc721MetadataApprovalForAllEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc721MetadataABI, "ApprovalForAll">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc721MetadataABI,
    eventName: "ApprovalForAll",
    ...config,
  } as UseContractEventConfig<typeof ierc721MetadataABI, "ApprovalForAll">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ierc721MetadataABI}__ and `eventName` set to `"Transfer"`.
 */
export function useIerc721MetadataTransferEvent(
  config: Omit<
    UseContractEventConfig<typeof ierc721MetadataABI, "Transfer">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ierc721MetadataABI,
    eventName: "Transfer",
    ...config,
  } as UseContractEventConfig<typeof ierc721MetadataABI, "Transfer">);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721ReceiverABI}__.
 */
export function useIerc721ReceiverWrite<
  TFunctionName extends string,
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721ReceiverABI,
          string
        >["request"]["abi"],
        TFunctionName,
        TMode
      >
    : UseContractWriteConfig<
        typeof ierc721ReceiverABI,
        TFunctionName,
        TMode
      > & {
        abi?: never;
      } = {} as any,
) {
  return useContractWrite<typeof ierc721ReceiverABI, TFunctionName, TMode>({
    abi: ierc721ReceiverABI,
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ierc721ReceiverABI}__ and `functionName` set to `"onERC721Received"`.
 */
export function useIerc721ReceiverOnErc721Received<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ierc721ReceiverABI,
          "onERC721Received"
        >["request"]["abi"],
        "onERC721Received",
        TMode
      > & { functionName?: "onERC721Received" }
    : UseContractWriteConfig<
        typeof ierc721ReceiverABI,
        "onERC721Received",
        TMode
      > & {
        abi?: never;
        functionName?: "onERC721Received";
      } = {} as any,
) {
  return useContractWrite<typeof ierc721ReceiverABI, "onERC721Received", TMode>(
    {
      abi: ierc721ReceiverABI,
      functionName: "onERC721Received",
      ...config,
    } as any,
  );
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721ReceiverABI}__.
 */
export function usePrepareIerc721ReceiverWrite<TFunctionName extends string>(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ierc721ReceiverABI, TFunctionName>,
    "abi"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721ReceiverABI,
    ...config,
  } as UsePrepareContractWriteConfig<typeof ierc721ReceiverABI, TFunctionName>);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ierc721ReceiverABI}__ and `functionName` set to `"onERC721Received"`.
 */
export function usePrepareIerc721ReceiverOnErc721Received(
  config: Omit<
    UsePrepareContractWriteConfig<
      typeof ierc721ReceiverABI,
      "onERC721Received"
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ierc721ReceiverABI,
    functionName: "onERC721Received",
    ...config,
  } as UsePrepareContractWriteConfig<
    typeof ierc721ReceiverABI,
    "onERC721Received"
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function useIMulticall3Read<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getBasefee"`.
 */
export function useIMulticall3GetBasefee<
  TFunctionName extends "getBasefee",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getBasefee",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getBlockHash"`.
 */
export function useIMulticall3GetBlockHash<
  TFunctionName extends "getBlockHash",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getBlockHash",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getBlockNumber"`.
 */
export function useIMulticall3GetBlockNumber<
  TFunctionName extends "getBlockNumber",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getBlockNumber",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getChainId"`.
 */
export function useIMulticall3GetChainId<
  TFunctionName extends "getChainId",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getChainId",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getCurrentBlockCoinbase"`.
 */
export function useIMulticall3GetCurrentBlockCoinbase<
  TFunctionName extends "getCurrentBlockCoinbase",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getCurrentBlockCoinbase",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getCurrentBlockDifficulty"`.
 */
export function useIMulticall3GetCurrentBlockDifficulty<
  TFunctionName extends "getCurrentBlockDifficulty",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getCurrentBlockDifficulty",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getCurrentBlockGasLimit"`.
 */
export function useIMulticall3GetCurrentBlockGasLimit<
  TFunctionName extends "getCurrentBlockGasLimit",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getCurrentBlockGasLimit",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getCurrentBlockTimestamp"`.
 */
export function useIMulticall3GetCurrentBlockTimestamp<
  TFunctionName extends "getCurrentBlockTimestamp",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getCurrentBlockTimestamp",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getEthBalance"`.
 */
export function useIMulticall3GetEthBalance<
  TFunctionName extends "getEthBalance",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getEthBalance",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"getLastBlockHash"`.
 */
export function useIMulticall3GetLastBlockHash<
  TFunctionName extends "getLastBlockHash",
  TSelectData = ReadContractResult<typeof iMulticall3ABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof iMulticall3ABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: iMulticall3ABI,
    functionName: "getLastBlockHash",
    ...config,
  } as UseContractReadConfig<
    typeof iMulticall3ABI,
    TFunctionName,
    TSelectData
  >);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function useIMulticall3Write<
  TFunctionName extends string,
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof iMulticall3ABI,
          string
        >["request"]["abi"],
        TFunctionName,
        TMode
      >
    : UseContractWriteConfig<typeof iMulticall3ABI, TFunctionName, TMode> & {
        abi?: never;
      } = {} as any,
) {
  return useContractWrite<typeof iMulticall3ABI, TFunctionName, TMode>({
    abi: iMulticall3ABI,
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"aggregate"`.
 */
export function useIMulticall3Aggregate<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof iMulticall3ABI,
          "aggregate"
        >["request"]["abi"],
        "aggregate",
        TMode
      > & { functionName?: "aggregate" }
    : UseContractWriteConfig<typeof iMulticall3ABI, "aggregate", TMode> & {
        abi?: never;
        functionName?: "aggregate";
      } = {} as any,
) {
  return useContractWrite<typeof iMulticall3ABI, "aggregate", TMode>({
    abi: iMulticall3ABI,
    functionName: "aggregate",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"aggregate3"`.
 */
export function useIMulticall3Aggregate3<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof iMulticall3ABI,
          "aggregate3"
        >["request"]["abi"],
        "aggregate3",
        TMode
      > & { functionName?: "aggregate3" }
    : UseContractWriteConfig<typeof iMulticall3ABI, "aggregate3", TMode> & {
        abi?: never;
        functionName?: "aggregate3";
      } = {} as any,
) {
  return useContractWrite<typeof iMulticall3ABI, "aggregate3", TMode>({
    abi: iMulticall3ABI,
    functionName: "aggregate3",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"aggregate3Value"`.
 */
export function useIMulticall3Aggregate3Value<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof iMulticall3ABI,
          "aggregate3Value"
        >["request"]["abi"],
        "aggregate3Value",
        TMode
      > & { functionName?: "aggregate3Value" }
    : UseContractWriteConfig<
        typeof iMulticall3ABI,
        "aggregate3Value",
        TMode
      > & {
        abi?: never;
        functionName?: "aggregate3Value";
      } = {} as any,
) {
  return useContractWrite<typeof iMulticall3ABI, "aggregate3Value", TMode>({
    abi: iMulticall3ABI,
    functionName: "aggregate3Value",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"blockAndAggregate"`.
 */
export function useIMulticall3BlockAndAggregate<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof iMulticall3ABI,
          "blockAndAggregate"
        >["request"]["abi"],
        "blockAndAggregate",
        TMode
      > & { functionName?: "blockAndAggregate" }
    : UseContractWriteConfig<
        typeof iMulticall3ABI,
        "blockAndAggregate",
        TMode
      > & {
        abi?: never;
        functionName?: "blockAndAggregate";
      } = {} as any,
) {
  return useContractWrite<typeof iMulticall3ABI, "blockAndAggregate", TMode>({
    abi: iMulticall3ABI,
    functionName: "blockAndAggregate",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"tryAggregate"`.
 */
export function useIMulticall3TryAggregate<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof iMulticall3ABI,
          "tryAggregate"
        >["request"]["abi"],
        "tryAggregate",
        TMode
      > & { functionName?: "tryAggregate" }
    : UseContractWriteConfig<typeof iMulticall3ABI, "tryAggregate", TMode> & {
        abi?: never;
        functionName?: "tryAggregate";
      } = {} as any,
) {
  return useContractWrite<typeof iMulticall3ABI, "tryAggregate", TMode>({
    abi: iMulticall3ABI,
    functionName: "tryAggregate",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"tryBlockAndAggregate"`.
 */
export function useIMulticall3TryBlockAndAggregate<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof iMulticall3ABI,
          "tryBlockAndAggregate"
        >["request"]["abi"],
        "tryBlockAndAggregate",
        TMode
      > & { functionName?: "tryBlockAndAggregate" }
    : UseContractWriteConfig<
        typeof iMulticall3ABI,
        "tryBlockAndAggregate",
        TMode
      > & {
        abi?: never;
        functionName?: "tryBlockAndAggregate";
      } = {} as any,
) {
  return useContractWrite<typeof iMulticall3ABI, "tryBlockAndAggregate", TMode>(
    {
      abi: iMulticall3ABI,
      functionName: "tryBlockAndAggregate",
      ...config,
    } as any,
  );
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function usePrepareIMulticall3Write<TFunctionName extends string>(
  config: Omit<
    UsePrepareContractWriteConfig<typeof iMulticall3ABI, TFunctionName>,
    "abi"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: iMulticall3ABI,
    ...config,
  } as UsePrepareContractWriteConfig<typeof iMulticall3ABI, TFunctionName>);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"aggregate"`.
 */
export function usePrepareIMulticall3Aggregate(
  config: Omit<
    UsePrepareContractWriteConfig<typeof iMulticall3ABI, "aggregate">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: iMulticall3ABI,
    functionName: "aggregate",
    ...config,
  } as UsePrepareContractWriteConfig<typeof iMulticall3ABI, "aggregate">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"aggregate3"`.
 */
export function usePrepareIMulticall3Aggregate3(
  config: Omit<
    UsePrepareContractWriteConfig<typeof iMulticall3ABI, "aggregate3">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: iMulticall3ABI,
    functionName: "aggregate3",
    ...config,
  } as UsePrepareContractWriteConfig<typeof iMulticall3ABI, "aggregate3">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"aggregate3Value"`.
 */
export function usePrepareIMulticall3Aggregate3Value(
  config: Omit<
    UsePrepareContractWriteConfig<typeof iMulticall3ABI, "aggregate3Value">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: iMulticall3ABI,
    functionName: "aggregate3Value",
    ...config,
  } as UsePrepareContractWriteConfig<typeof iMulticall3ABI, "aggregate3Value">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"blockAndAggregate"`.
 */
export function usePrepareIMulticall3BlockAndAggregate(
  config: Omit<
    UsePrepareContractWriteConfig<typeof iMulticall3ABI, "blockAndAggregate">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: iMulticall3ABI,
    functionName: "blockAndAggregate",
    ...config,
  } as UsePrepareContractWriteConfig<
    typeof iMulticall3ABI,
    "blockAndAggregate"
  >);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"tryAggregate"`.
 */
export function usePrepareIMulticall3TryAggregate(
  config: Omit<
    UsePrepareContractWriteConfig<typeof iMulticall3ABI, "tryAggregate">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: iMulticall3ABI,
    functionName: "tryAggregate",
    ...config,
  } as UsePrepareContractWriteConfig<typeof iMulticall3ABI, "tryAggregate">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link iMulticall3ABI}__ and `functionName` set to `"tryBlockAndAggregate"`.
 */
export function usePrepareIMulticall3TryBlockAndAggregate(
  config: Omit<
    UsePrepareContractWriteConfig<
      typeof iMulticall3ABI,
      "tryBlockAndAggregate"
    >,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: iMulticall3ABI,
    functionName: "tryBlockAndAggregate",
    ...config,
  } as UsePrepareContractWriteConfig<
    typeof iMulticall3ABI,
    "tryBlockAndAggregate"
  >);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ownableABI}__.
 */
export function useOwnableRead<
  TFunctionName extends string,
  TSelectData = ReadContractResult<typeof ownableABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ownableABI, TFunctionName, TSelectData>,
    "abi"
  > = {} as any,
) {
  return useContractRead({
    abi: ownableABI,
    ...config,
  } as UseContractReadConfig<typeof ownableABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractRead}__ with `abi` set to __{@link ownableABI}__ and `functionName` set to `"owner"`.
 */
export function useOwnableOwner<
  TFunctionName extends "owner",
  TSelectData = ReadContractResult<typeof ownableABI, TFunctionName>,
>(
  config: Omit<
    UseContractReadConfig<typeof ownableABI, TFunctionName, TSelectData>,
    "abi" | "functionName"
  > = {} as any,
) {
  return useContractRead({
    abi: ownableABI,
    functionName: "owner",
    ...config,
  } as UseContractReadConfig<typeof ownableABI, TFunctionName, TSelectData>);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ownableABI}__.
 */
export function useOwnableWrite<
  TFunctionName extends string,
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<typeof ownableABI, string>["request"]["abi"],
        TFunctionName,
        TMode
      >
    : UseContractWriteConfig<typeof ownableABI, TFunctionName, TMode> & {
        abi?: never;
      } = {} as any,
) {
  return useContractWrite<typeof ownableABI, TFunctionName, TMode>({
    abi: ownableABI,
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ownableABI}__ and `functionName` set to `"renounceOwnership"`.
 */
export function useOwnableRenounceOwnership<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ownableABI,
          "renounceOwnership"
        >["request"]["abi"],
        "renounceOwnership",
        TMode
      > & { functionName?: "renounceOwnership" }
    : UseContractWriteConfig<typeof ownableABI, "renounceOwnership", TMode> & {
        abi?: never;
        functionName?: "renounceOwnership";
      } = {} as any,
) {
  return useContractWrite<typeof ownableABI, "renounceOwnership", TMode>({
    abi: ownableABI,
    functionName: "renounceOwnership",
    ...config,
  } as any);
}

/**
 * Wraps __{@link useContractWrite}__ with `abi` set to __{@link ownableABI}__ and `functionName` set to `"transferOwnership"`.
 */
export function useOwnableTransferOwnership<
  TMode extends WriteContractMode = undefined,
>(
  config: TMode extends "prepared"
    ? UseContractWriteConfig<
        PrepareWriteContractResult<
          typeof ownableABI,
          "transferOwnership"
        >["request"]["abi"],
        "transferOwnership",
        TMode
      > & { functionName?: "transferOwnership" }
    : UseContractWriteConfig<typeof ownableABI, "transferOwnership", TMode> & {
        abi?: never;
        functionName?: "transferOwnership";
      } = {} as any,
) {
  return useContractWrite<typeof ownableABI, "transferOwnership", TMode>({
    abi: ownableABI,
    functionName: "transferOwnership",
    ...config,
  } as any);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ownableABI}__.
 */
export function usePrepareOwnableWrite<TFunctionName extends string>(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ownableABI, TFunctionName>,
    "abi"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ownableABI,
    ...config,
  } as UsePrepareContractWriteConfig<typeof ownableABI, TFunctionName>);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ownableABI}__ and `functionName` set to `"renounceOwnership"`.
 */
export function usePrepareOwnableRenounceOwnership(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ownableABI, "renounceOwnership">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ownableABI,
    functionName: "renounceOwnership",
    ...config,
  } as UsePrepareContractWriteConfig<typeof ownableABI, "renounceOwnership">);
}

/**
 * Wraps __{@link usePrepareContractWrite}__ with `abi` set to __{@link ownableABI}__ and `functionName` set to `"transferOwnership"`.
 */
export function usePrepareOwnableTransferOwnership(
  config: Omit<
    UsePrepareContractWriteConfig<typeof ownableABI, "transferOwnership">,
    "abi" | "functionName"
  > = {} as any,
) {
  return usePrepareContractWrite({
    abi: ownableABI,
    functionName: "transferOwnership",
    ...config,
  } as UsePrepareContractWriteConfig<typeof ownableABI, "transferOwnership">);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ownableABI}__.
 */
export function useOwnableEvent<TEventName extends string>(
  config: Omit<
    UseContractEventConfig<typeof ownableABI, TEventName>,
    "abi"
  > = {} as any,
) {
  return useContractEvent({
    abi: ownableABI,
    ...config,
  } as UseContractEventConfig<typeof ownableABI, TEventName>);
}

/**
 * Wraps __{@link useContractEvent}__ with `abi` set to __{@link ownableABI}__ and `eventName` set to `"OwnershipTransferred"`.
 */
export function useOwnableOwnershipTransferredEvent(
  config: Omit<
    UseContractEventConfig<typeof ownableABI, "OwnershipTransferred">,
    "abi" | "eventName"
  > = {} as any,
) {
  return useContractEvent({
    abi: ownableABI,
    eventName: "OwnershipTransferred",
    ...config,
  } as UseContractEventConfig<typeof ownableABI, "OwnershipTransferred">);
}
