// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./MultiToken.sol";
import "./Vault.sol";
import "./LoanNft.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoanManager is Ownable {
    using MultiToken for MultiToken.Asset;
    using Counters for Counters.Counter;

    Counters.Counter public loanId;

    uint256 private SECURITY_EXT = 86400; // 1 day = 60*60*24
    address public immutable VAULT;
    address public immutable LOAN;
    mapping(uint256 => Loan) private Loans;

    /*------------------------/
    ｜        Type            ｜
    /------------------------*/

    struct Loan {
        MultiToken.Asset collateral;
        MultiToken.Asset loanAsset;
        uint256 repayAmount;
        uint256 duration;
        uint256 expiration;
        LoanStatus status;
        uint256 collateralFilled;
        uint256 deadline;
        uint256 dueTime;
        address borrower;
    }
    enum LoanStatus {
        CLOSED,
        OPEN,
        WAITING,
        RUNNING,
        REPAID,
        VIOLATED
    }
    /*************************/
    /*        Events         */
    /*************************/
    event LoanCreated(
        address indexed borrower,
        uint256 indexed loanId,
        bytes loanData
    );

    event LoanUpdated(address indexed borrower, uint256 indexed loanId);
    event OfferSubmitted(
        address indexed lender,
        uint256 indexed loanId,
        uint256 deadline
    );
    event OfferRevoked(address indexed lender, uint256 indexed loanId);
    event LoanRepaid(address indexed borrower, uint256 indexed loanId);
    event OfferAccepted(
        address indexed borrower,
        uint256 indexed loanId,
        uint256 dueTime
    );
    event LoanViolated(address indexed borrower, uint256 indexed loanId);
    event LoanClosed(address indexed borrower, uint256 loanId);

    constructor() {
        Vault vault = new Vault();
        VAULT = address(vault);
        LoanNft loan = new LoanNft();
        LOAN = address(loan);
    }

    modifier onlyLender(uint256 _loanId) {
        require(LoanNft(LOAN).ownerOf(_loanId) == msg.sender, "Not lender.");
        _;
    }

    function createLoanRequest(
        MultiToken.Asset memory _collateral,
        MultiToken.Asset memory _loanAsset,
        uint256 _repayAmount,
        uint256 _duration,
        uint256 _expiration,
        uint256 _preCollateral
    ) external {
        _beforeCheck(
            _collateral,
            _loanAsset,
            _duration,
            _expiration,
            LoanStatus.OPEN,
            address(0),
            true
        );

        Loan memory _loan;
        _loan.collateral = _collateral;
        _loan.loanAsset = _loanAsset;
        _loan.repayAmount = _repayAmount;
        _loan.duration = _duration;
        _loan.expiration = _expiration;
        _loan.status = LoanStatus.OPEN;
        _loan.borrower = msg.sender;

        if (_preCollateral > 0) {
            MultiToken.Asset memory deposit;
            _copyObj(deposit, _collateral);
            deposit.amount = _preCollateral;

            Vault(VAULT).pull(deposit, msg.sender);
        }
        _loan.collateralFilled = _preCollateral;
        Loans[loanId.current()] = _loan;
        bytes memory loanData = _encodeLoanData(_loan);

        emit LoanCreated(msg.sender, loanId.current(), loanData);
        loanId.increment();
    }

    function revokeLoanRequest(uint256 _loanId) external {
        Loan memory loan = Loans[_loanId];

        // check loan status
        require(
            loan.status == LoanStatus.OPEN && loan.borrower == msg.sender,
            "Invalid request."
        );

        // withdraw pre-collaterl
        if (loan.collateralFilled > 0) {
            MultiToken.Asset memory preCollateral;
            _copyObj(preCollateral, loan.collateral);
            preCollateral.amount = loan.collateralFilled;

            Vault(VAULT).push(preCollateral, msg.sender);

            loan.collateralFilled = 0;
        }

        // update loan object
        loan.status = LoanStatus.CLOSED;
        Loans[_loanId] = loan;

        emit LoanClosed(msg.sender, _loanId);
    }

    function acceptOffer(uint256 _loanId) external {
        Loan memory loan = Loans[_loanId];

        // check loan status
        require(
            loan.status == LoanStatus.WAITING && loan.borrower == msg.sender,
            "Invalid request."
        );

        // transfer remaining collateral

        if (loan.collateral.amount > loan.collateralFilled) {
            uint256 remainingAmount = loan.collateral.amount -
                loan.collateralFilled;

            MultiToken.Asset memory remainingAsset;
            _copyObj(remainingAsset, loan.collateral);
            remainingAsset.amount = remainingAmount;

            Vault(VAULT).pull(remainingAsset, msg.sender);
        }

        // transfer loan asset to borrower
        Vault(VAULT).push(loan.loanAsset, msg.sender);

        // update loan object
        loan.collateralFilled = loan.collateral.amount;
        loan.status = LoanStatus.RUNNING;
        loan.dueTime = loan.duration + block.timestamp;
        Loans[_loanId] = loan;

        emit OfferAccepted(msg.sender, _loanId, loan.dueTime);
    }

    function repayLoan(uint256 _loanId) external {
        Loan memory loan = Loans[_loanId];

        // check loan status
        require(loan.status == LoanStatus.RUNNING, "Status error.");

        // check dueDate
        if (loan.dueTime < block.timestamp) {
            loan.status = LoanStatus.VIOLATED;

            emit LoanViolated(loan.borrower, _loanId);
        } else {
            // transfer repay amount

            MultiToken.Asset memory repayAsset;
            _copyObj(repayAsset, loan.loanAsset);
            repayAsset.amount = loan.repayAmount;

            Vault(VAULT).pull(repayAsset, msg.sender);

            // return collateral
            Vault(VAULT).push(loan.collateral, loan.borrower);

            loan.status = LoanStatus.REPAID;

            emit LoanRepaid(loan.borrower, _loanId);
        }

        // update loan object
        Loans[_loanId] = loan;
    }

    function updateLoanRequest(
        uint256 _loanId,
        uint256 _preCollateral,
        uint256 _repayAmount,
        uint256 _duration,
        uint256 _expiration
    ) external {
        Loan memory loan = Loans[_loanId];
        _beforeCheck(
            loan.collateral,
            loan.loanAsset,
            _duration,
            _expiration,
            loan.status,
            loan.borrower,
            false
        );

        MultiToken.Asset memory asset;
        _copyObj(asset, loan.collateral);

        if (_preCollateral > loan.collateralFilled) {
            asset.amount = _preCollateral - loan.collateralFilled;
            Vault(VAULT).pull(asset, msg.sender);
        } else if (_preCollateral < loan.collateralFilled) {
            asset.amount = loan.collateralFilled - _preCollateral;
            Vault(VAULT).push(asset, msg.sender);
        }

        loan.collateralFilled = _preCollateral;
        loan.duration = _duration;
        loan.repayAmount = _repayAmount;
        loan.expiration = _expiration;

        Loans[_loanId] = loan;
        emit LoanUpdated(msg.sender, _loanId);
    }

    function submitOffer(uint256 _loanId) external {
        Loan memory loan = Loans[_loanId];

        // check loan status
        require(
            loan.status == LoanStatus.OPEN && loan.expiration > block.timestamp,
            "Status error."
        );
        // transfer loan asset to loanManager
        Vault(VAULT).pull(loan.loanAsset, msg.sender);

        //update loan object
        loan.status = LoanStatus.WAITING;

        loan.deadline = block.timestamp + SECURITY_EXT > loan.expiration
            ? block.timestamp + SECURITY_EXT
            : loan.expiration;

        Loans[_loanId] = loan;

        //mint NFT to lender

        LoanNft(LOAN).mintLoanNft(msg.sender, _loanId);

        emit OfferSubmitted(msg.sender, _loanId, loan.deadline);
    }

    function revokeOffer(uint256 _loanId) external onlyLender(_loanId) {
        Loan memory loan = Loans[_loanId];

        // check loan status
        require(loan.status == LoanStatus.WAITING, "Status error.");
        // burn NFT
        LoanNft(LOAN).burnLoanNft(_loanId);

        // return lending asset
        Vault(VAULT).push(loan.loanAsset, msg.sender);

        // transfer pre-collateral asset
        if (loan.collateralFilled > 0 && block.timestamp >= loan.deadline) {
            address collateralAddress = loan.collateral.assetAddress;
            IERC20(collateralAddress).transfer(
                msg.sender,
                loan.collateral.amount
            );
            MultiToken.Asset memory preCollateral;
            _copyObj(preCollateral, loan.collateral);
            preCollateral.amount = loan.collateralFilled;

            Vault(VAULT).push(preCollateral, msg.sender);

            loan.collateralFilled = 0;
        }

        // update loan object
        loan.status = LoanStatus.OPEN;
        loan.deadline = 0;
        Loans[_loanId] = loan;

        emit OfferRevoked(msg.sender, _loanId);
    }

    function withdrawLendingAsset(
        uint256 _loanId
    ) external onlyLender(_loanId) {
        Loan memory loan = Loans[_loanId];
        LoanStatus status = loan.status;

        MultiToken.Asset memory withdrawAsset;
        bool withdrawable;

        if (
            (status == LoanStatus.RUNNING && loan.dueTime < block.timestamp) ||
            status == LoanStatus.VIOLATED
        ) {
            _copyObj(withdrawAsset, loan.collateral);
            withdrawAsset.amount = loan.collateralFilled;

            loan.status = LoanStatus.VIOLATED;
            withdrawable = true;
        }
        if (status == LoanStatus.REPAID) {
            _copyObj(withdrawAsset, loan.loanAsset);
            withdrawAsset.amount = loan.repayAmount;

            loan.status = LoanStatus.CLOSED;
            withdrawable = true;
        }

        require(withdrawable, "No withdrawable.");

        Vault(VAULT).push(withdrawAsset, msg.sender);

        Loans[_loanId] = loan;
        LoanNft(LOAN).burnLoanNft(_loanId);
        emit LoanClosed(loan.borrower, _loanId);
    }

    function setSecurityExt(uint256 security) external onlyOwner {
        SECURITY_EXT = security;
    }

    function getLoanObj(uint256 _loanId) external view returns (Loan memory) {
        return Loans[_loanId];
    }

    function getLoanStatus(uint256 _loanId) external view returns (LoanStatus) {
        return Loans[_loanId].status;
    }

    function _copyObj(
        MultiToken.Asset memory A,
        MultiToken.Asset memory B
    ) internal pure {
        A.category = B.category;
        A.assetAddress = B.assetAddress;
        A.id = B.id;
        A.amount = B.amount;
    }

    function _beforeCheck(
        MultiToken.Asset memory _collateral,
        MultiToken.Asset memory _loanAsset,
        uint256 _duration,
        uint256 _expiration,
        LoanStatus _status,
        address _borrower,
        bool _creation
    ) internal view {
        if (_creation) {
            require(
                _collateral.assetAddress != address(0) &&
                    _collateral.amount > 0 &&
                    _loanAsset.assetAddress != address(0) &&
                    _loanAsset.amount > 0 &&
                    _loanAsset.category == MultiToken.Category.ERC20,
                "Param error."
            );
        } else {
            require(
                _status == LoanStatus.OPEN && _borrower == msg.sender,
                "Invalid request."
            );
        }
        require(_duration > 0 && _expiration > block.timestamp, "Param error.");
    }

    function _encodeLoanData(
        Loan memory _loan
    ) internal pure returns (bytes memory _result) {
        _result = abi.encode(_loan);
    }
}
