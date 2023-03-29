// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract LoanNft is ERC721, ERC721Burnable {
    address public loanManager;

    constructor() ERC721("LOAN", "LOAN") {
        loanManager = msg.sender;
    }

    modifier onlyManager() {
        require(msg.sender == loanManager, "Caller is not the Manager");
        _;
    }

    function mintLoanNft(address to, uint256 id) external onlyManager {
        _safeMint(to, id);
    }

    function burnLoanNft(uint256 id) external onlyManager {
        burn(id);
    }
}
