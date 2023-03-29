// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./MultiToken.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Vault is IERC721Receiver {
    using MultiToken for MultiToken.Asset;

    address public loanManager;

    event VaultPull(MultiToken.Asset asset, address indexed origin);
    event VaultPush(MultiToken.Asset asset, address indexed beneficiary);
    event VaultPushFrom(
        MultiToken.Asset asset,
        address indexed origin,
        address indexed beneficiary
    );

    constructor() {
        loanManager = msg.sender;
    }

    modifier onlyManager() {
        require(msg.sender == loanManager, "Caller is not the Manager");
        _;
    }

    function pull(
        MultiToken.Asset memory _asset,
        address _origin
    ) external onlyManager returns (bool) {
        _asset.safeTransferAssetFrom(_origin, address(this));
        emit VaultPull(_asset, _origin);
        return true;
    }

    function push(
        MultiToken.Asset memory _asset,
        address _beneficiary
    ) external onlyManager returns (bool) {
        _asset.safeTransferAssetFrom(address(this), _beneficiary);
        emit VaultPush(_asset, _beneficiary);
        return true;
    }

    function onERC721Received(
        address /*operator*/,
        address /*from*/,
        uint256 /*tokenId*/,
        bytes calldata /*data*/
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
