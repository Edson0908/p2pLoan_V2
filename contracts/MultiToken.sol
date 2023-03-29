// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

library MultiToken {
    enum Category {
        ERC20,
        ERC721
    }

    struct Asset {
        Category category;
        address assetAddress;
        uint256 id;
        uint256 amount;
    }

    function safeTransferAssetFrom(
        Asset memory asset,
        address from,
        address to
    ) internal {
        _transferAssetFrom(asset, from, to, true);
    }

    function _transferAssetFrom(
        Asset memory asset,
        address from,
        address to,
        bool isSafe
    ) private {
        if (asset.category == Category.ERC20) {
            if (from == address(this))
                require(
                    IERC20(asset.assetAddress).transfer(to, asset.amount),
                    "MultiToken: ERC20 transfer failed"
                );
            else
                require(
                    IERC20(asset.assetAddress).transferFrom(
                        from,
                        to,
                        asset.amount
                    ),
                    "MultiToken: ERC20 transferFrom failed"
                );
        } else if (asset.category == Category.ERC721) {
            if (!isSafe)
                IERC721(asset.assetAddress).transferFrom(from, to, asset.id);
            else
                IERC721(asset.assetAddress).safeTransferFrom(
                    from,
                    to,
                    asset.id,
                    ""
                );
        } else {
            revert("MultiToken: Unsupported category");
        }
    }

    function balanceOf(
        Asset memory asset,
        address account
    ) internal view returns (uint256) {
        if (asset.category == Category.ERC20) {
            return IERC20(asset.assetAddress).balanceOf(account);
        } else if (asset.category == Category.ERC721) {
            return
                IERC721(asset.assetAddress).ownerOf(asset.id) == account
                    ? 1
                    : 0;
        } else {
            revert("MultiToken: Unsupported category");
        }
    }

    function approveAsset(Asset memory asset, address spender) internal {
        if (asset.category == Category.ERC20) {
            IERC20(asset.assetAddress).approve(spender, asset.amount);
        } else if (asset.category == Category.ERC721) {
            IERC721(asset.assetAddress).approve(spender, asset.id);
        } else {
            revert("MultiToken: Unsupported category");
        }
    }

    function approvalCheck(
        Asset memory asset,
        address owner,
        address spender
    ) internal view returns (bool result) {
        if (asset.category == Category.ERC20) {
            result = IERC20(asset.assetAddress).allowance(owner, spender) >=
                asset.amount
                ? true
                : false;
        } else if (asset.category == Category.ERC721) {
            result = IERC721(asset.assetAddress).getApproved(asset.id) ==
                spender
                ? true
                : false;
        } else {
            revert("MultiToken: Unsupported category");
        }
    }
}
