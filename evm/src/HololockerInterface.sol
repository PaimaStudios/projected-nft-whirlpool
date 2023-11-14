// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface HololockerInterface is IERC721Receiver {
    /// @dev Data structure that must exist for each locked NFT
    struct LockInfo {
        /// Timestamp when NFT will be withdrawable, 0 if unlock hasn't been requested
        uint256 unlockTime;
        /// Rightful owner of the NFT
        address owner;
        /// Account that initiated the lock
        address operator;
    }

    /// @dev This emits when NFT is locked, either via lock function or via NFT being sent to this contract
    /// @param token NFT address
    /// @param owner Rightful owner of the NFT
    /// @param tokenId NFT token identifier
    /// @param operator Address initiating the lock
    event Lock(address indexed token, address indexed owner, uint256 tokenId, address operator);

    /// @dev This emits when NFT is requested to unlock.
    /// @param token NFT address
    /// @param owner Rightful owner of the NFT
    /// @param tokenId NFT token identifier
    /// @param operator Address initiating the unlock request
    /// @param unlockTime Timestamp when NFT will be withdrawable.
    event Unlock(address indexed token, address indexed owner, uint256 tokenId, address operator, uint256 unlockTime);

    /// @dev This emits when NFT is withdrawn.
    /// @param token NFT address
    /// @param owner Rightful owner of the NFT
    /// @param tokenId NFT token identifier
    /// @param operator Address initiating the withdraw
    event Withdraw(address indexed token, address indexed owner, uint256 tokenId, address operator);

    /// @dev This emits when lockTime value changes.
    /// @param newValue New lockTime value
    event LockTimeUpdate(uint256 newValue);

    /// @notice Returns `LockInfo` for specified `token => tokenId`
    /// @param token NFT tokens contract address
    /// @param tokenId NFT tokens identifier
    /// @return The `LockInfo` struct information
    function getLockInfo(address token, uint256 tokenId) external view returns (LockInfo memory);

    /// @notice Initiates a lock for one or more NFTs
    /// @dev Reverts if `tokens` length is not equal to `tokenIds` length.
    /// Stores a `LockInfo` struct `{owner: owner, operator: msg.sender, unlockTime: 0}` for each `token => tokenId`
    /// Emits `Lock` event.
    /// Transfers each token:tokenId to this contract.
    /// @param tokens NFT tokens contract addresses
    /// @param tokenIds NFT tokens identifiers
    /// @param owner NFT tokens owner
    function lock(address[] memory tokens, uint256[] memory tokenIds, address owner) external;

    /// @notice Requests unlock for one or more NFTs
    /// @dev Reverts if `tokens` length is not equal to `tokenIds` length.
    /// Reverts if msg.sender is neither `owner` nor `operator` of LockInfo struct for
    /// any of the input tokens.
    /// Reverts if `unlockTime` of LockInfo struct for any of the input tokens is not 0.
    /// Modifies a `LockInfo` struct `{unlockTime: block.timestamp + lockTime}` for each `token => tokenId`
    /// Emits `Unlock` event.
    /// @param tokens NFT tokens contract addresses
    /// @param tokenIds NFT tokens identifiers
    function requestUnlock(address[] memory tokens, uint256[] memory tokenIds) external;

    /// @notice Withdraws one or more NFTs to their rightful owner
    /// @dev Reverts if `tokens` length is not equal to `tokenIds` length.
    /// Reverts if msg.sender is neither `owner` nor `operator` of LockInfo struct for
    /// any of the input tokens.
    /// Reverts if `unlockTime` of LockInfo struct for any of the input tokens is
    /// either 0 or greater than block.timestamp.
    /// Modifies a `LockInfo` struct `{unlockTime: block.timestamp + lockTime}` for each `token => tokenId`
    /// Emits `Unlock` event.
    /// @param tokens NFT tokens contract addresses
    /// @param tokenIds NFT tokens identifiers
    function withdraw(address[] memory tokens, uint256[] memory tokenIds) external;

    /// @notice Returns `lockTime`, which is the value that gets added to block.timestamp and saved as unlockTime
    /// in the requestUnlock function.
    /// @return The `lockTime` variable
    function getLockTime() external view returns (uint256);

    /// @notice Changes `lockTime` variable that is used in `requestUnlock`.
    /// @dev This function should be protected with appropriate access control mechanisms.
    /// The new value should be checked against a sane upper limit constant, which if exceeded,
    /// should cause a revert.
    /// Emits `LockTimeUpdate` event.
    /// @param newLockTime New lockTime value
    function setLockTime(uint256 newLockTime) external;
}
