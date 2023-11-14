// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;
/* solhint-disable no-console */

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/Hololocker.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockNFT is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}

contract HololockerTest is Test {
    event Lock(address indexed token, address indexed owner, uint256 tokenId, address operator);
    event Unlock(address indexed token, address indexed owner, uint256 tokenId, address operator, uint256 unlockTime);
    event Withdraw(address indexed token, address indexed owner, uint256 tokenId, address operator);
    event LockTimeUpdate(uint256 newValue);

    Hololocker hololocker;
    MockNFT mockNFT;
    address[] tokens;
    uint256[] tokenIds;
    address alice = makeAddr("alice");
    uint256 maxLockTime;

    function setUp() public {
        hololocker = new Hololocker(1 minutes, address(this));
        mockNFT = new MockNFT("X", "Y");
        tokenIds.push(0);
        tokens.push(address(mockNFT));
        mockNFT.mint(address(this), tokenIds[0]);
        mockNFT.setApprovalForAll(address(hololocker), true);
        maxLockTime = hololocker.MAXIMUM_LOCK_TIME();
    }

    function requestUnlockAndWithdrawAndAssert(address owner_, address operator_) public {
        Hololocker.LockInfo memory info;
        info = hololocker.getLockInfo(tokens[0], tokenIds[0]);
        assertEq(info.unlockTime, 0);
        assertEq(info.owner, owner_);
        assertEq(info.operator, operator_);
        assertEq(mockNFT.ownerOf(tokenIds[0]), address(hololocker));

        vm.roll(block.number + 10);
        vm.expectEmit(true, true, true, true);
        emit Unlock(tokens[0], info.owner, tokenIds[0], info.operator, block.timestamp + hololocker.getLockTime());
        hololocker.requestUnlock(tokens, tokenIds);
        info = hololocker.getLockInfo(tokens[0], tokenIds[0]);
        assertEq(info.unlockTime, block.timestamp + hololocker.getLockTime());
        assertEq(info.owner, owner_);
        assertEq(info.operator, operator_);

        vm.warp(block.timestamp + hololocker.getLockTime());
        vm.expectEmit(true, true, true, true);
        emit Withdraw(tokens[0], info.owner, tokenIds[0], info.operator);
        hololocker.withdraw(tokens, tokenIds);
        info = hololocker.getLockInfo(tokens[0], tokenIds[0]);
        assertEq(info.unlockTime, 0);
        assertEq(info.owner, address(0));
        assertEq(info.operator, address(0));
        assertEq(mockNFT.ownerOf(tokenIds[0]), owner_);
    }

    function test_LockByLockFunction() public {
        vm.expectEmit(true, true, true, true);
        emit Lock(tokens[0], address(this), tokenIds[0], address(this));
        hololocker.lock(tokens, tokenIds, address(this));
        requestUnlockAndWithdrawAndAssert(address(this), address(this));
    }

    function test_LockByOperatorLockFunction() public {
        mockNFT.setApprovalForAll(alice, true);
        vm.startPrank(alice);

        vm.expectEmit(true, true, true, true);
        emit Lock(tokens[0], address(this), tokenIds[0], alice);
        hololocker.lock(tokens, tokenIds, address(this));
        requestUnlockAndWithdrawAndAssert(address(this), alice);
    }

    function test_LockBySafeTransfer() public {
        vm.expectEmit(true, true, true, true);
        emit Lock(tokens[0], address(this), tokenIds[0], address(this));
        ERC721(tokens[0]).safeTransferFrom(address(this), address(hololocker), tokenIds[0], "");
        requestUnlockAndWithdrawAndAssert(address(this), address(this));
    }

    function test_LockByOperatorSafeTransfer() public {
        mockNFT.setApprovalForAll(alice, true);
        vm.startPrank(alice);
        vm.expectEmit(true, true, true, true);
        emit Lock(tokens[0], address(this), tokenIds[0], alice);
        ERC721(tokens[0]).safeTransferFrom(address(this), address(hololocker), tokenIds[0], "");
        requestUnlockAndWithdrawAndAssert(address(this), alice);
    }

    function test_SetLockTime() public {
        uint256 newValue = maxLockTime - 10;
        vm.expectEmit(true, true, true, true);
        emit LockTimeUpdate(newValue);
        hololocker.setLockTime(newValue);
        assertEq(hololocker.getLockTime(), newValue);
    }

    function test_CannotLockInvalidInputArity() public {
        address[] memory tokens1 = new address[](1);
        tokens[0] = tokens[0];
        uint256[] memory tokenIds2 = new uint256[](2);

        vm.expectRevert(Hololocker.InvalidInputArity.selector);
        hololocker.lock(tokens1, tokenIds2, address(this));
    }

    function test_CannotRequestUnlockInvalidInputArity() public {
        address[] memory tokens1 = new address[](1);
        tokens[0] = tokens[0];
        uint256[] memory tokenIds2 = new uint256[](2);

        vm.expectRevert(Hololocker.InvalidInputArity.selector);
        hololocker.requestUnlock(tokens1, tokenIds2);
    }

    function test_CannotWithdrawInvalidInputArity() public {
        address[] memory tokens1 = new address[](1);
        tokens[0] = tokens[0];
        uint256[] memory tokenIds2 = new uint256[](2);

        vm.expectRevert(Hololocker.InvalidInputArity.selector);
        hololocker.withdraw(tokens1, tokenIds2);
    }

    function test_CannotRequestUnlockMultipleTimes() public {
        hololocker.lock(tokens, tokenIds, address(this));
        hololocker.requestUnlock(tokens, tokenIds);
        vm.expectRevert(Hololocker.UnlockAlreadyRequested.selector);
        hololocker.requestUnlock(tokens, tokenIds);
    }

    function test_CannotRequestUnlockUnauthorized() public {
        hololocker.lock(tokens, tokenIds, address(this));
        vm.prank(alice);
        vm.expectRevert(Hololocker.Unauthorized.selector);
        hololocker.requestUnlock(tokens, tokenIds);
    }

    function test_CannotRequestUnlockWithoutLocking() public {
        vm.expectRevert(Hololocker.Unauthorized.selector);
        hololocker.requestUnlock(tokens, tokenIds);
    }

    function test_CannotWithdrawUnauthorized() public {
        hololocker.lock(tokens, tokenIds, address(this));
        hololocker.requestUnlock(tokens, tokenIds);
        vm.warp(block.timestamp + hololocker.getLockTime());
        vm.prank(alice);
        vm.expectRevert(Hololocker.Unauthorized.selector);
        hololocker.withdraw(tokens, tokenIds);
    }

    function test_CannotWithdrawWithoutUnlocking() public {
        hololocker.lock(tokens, tokenIds, address(this));
        vm.expectRevert(Hololocker.NotUnlockedYet.selector);
        hololocker.withdraw(tokens, tokenIds);
    }

    function test_CannotWithdrawIfUnlockTimeNotReached() public {
        hololocker.lock(tokens, tokenIds, address(this));
        hololocker.requestUnlock(tokens, tokenIds);
        vm.warp(block.timestamp + hololocker.getLockTime() - 1);
        vm.expectRevert(Hololocker.NotUnlockedYet.selector);
        hololocker.withdraw(tokens, tokenIds);
    }

    function test_CannotSetLockTimeInvalid() public {
        vm.expectRevert(Hololocker.InvalidLockTime.selector);
        hololocker.setLockTime(maxLockTime + 1);
    }

    function test_CannotSetLockTimeUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        hololocker.setLockTime(maxLockTime);
    }
}
