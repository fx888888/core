// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal on-chain shop for a fishing game. It does not implement gambling,
/// random prize payouts, or a token reward system. Game score should be handled off-chain.
contract FishingShop {
    address public owner;
    uint256 public ammoPackPrice;
    bool public paused;

    mapping(address => uint256) public ammoPacks;
    event AmmoPurchased(address indexed player, uint256 packs, uint256 paid);
    event AmmoUsed(address indexed player, uint256 packs);
    event PriceChanged(uint256 newPrice);
    event PauseChanged(bool paused);
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "shop paused");
        _;
    }

    constructor(uint256 initialPackPrice) {
        require(initialPackPrice > 0, "price is zero");
        owner = msg.sender;
        ammoPackPrice = initialPackPrice;
    }

    function buyAmmo(uint256 packs) external payable whenNotPaused {
        require(packs > 0 && packs <= 100, "invalid pack count");
        uint256 cost = ammoPackPrice * packs;
        require(msg.value == cost, "incorrect CORE amount");
        ammoPacks[msg.sender] += packs;
        emit AmmoPurchased(msg.sender, packs, msg.value);
    }

    /// @dev This records consumption only; it does not validate fishing hits or award prizes.
    function useAmmo(uint256 packs) external whenNotPaused {
        require(packs > 0, "zero packs");
        require(ammoPacks[msg.sender] >= packs, "not enough ammo");
        ammoPacks[msg.sender] -= packs;
        emit AmmoUsed(msg.sender, packs);
    }

    function setAmmoPackPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "price is zero");
        ammoPackPrice = newPrice;
        emit PriceChanged(newPrice);
    }

    function setPaused(bool value) external onlyOwner {
        paused = value;
        emit PauseChanged(value);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero address");
        require(amount <= address(this).balance, "insufficient balance");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
        emit FundsWithdrawn(to, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        owner = newOwner;
    }

    receive() external payable {
        revert("use buyAmmo");
    }
}