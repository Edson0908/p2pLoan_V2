const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

const ERC20_CATEGORY = 0
const ERC721_CATEGORY = 1

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("【FUNCTION】createLoanReques", function () {
          let LoanManager, CollateralToken, TestNFT

          let LoanManagerContract,
              VaultContract,
              CollateralTokenContract,
              LendingTokenContract,
              TestNFTContract

          const DECIMALS = 18
          const ERC20_TOKENID = 0
          const COLLATERAL_AMOUNT = ethers.utils.parseUnits("1000", DECIMALS)
          const LENDING_AMOUNT = ethers.utils.parseUnits("2000", DECIMALS)
          const REPAY_AMOUNT = ethers.utils.parseUnits("2200", DECIMALS)

          let duration = 3600 // 1hour
          let expiration = Math.floor(Date.now() / 1000) + 3600 //1hour
          let collateralAsset
          let loanAsset
          let currentId

          beforeEach(async () => {
              // get signers
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              borrower = accounts[1]

              // get Contract instants
              LoanManagerContract = await ethers.getContract("LoanManager")
              CollateralTokenContract = await ethers.getContract(
                  "CollateralToken"
              )
              LendingTokenContract = await ethers.getContract("LendingToken")
              TestNFTContract = await ethers.getContract("TestNFT")
              VaultContract = await ethers.getContractAt(
                  "Vault",
                  await LoanManagerContract.VAULT()
              )

              LoanManager = LoanManagerContract.connect(borrower)

              loanAsset = {
                  category: ERC20_CATEGORY,
                  assetAddress: LendingTokenContract.address,
                  id: ERC20_TOKENID,
                  amount: LENDING_AMOUNT,
              }

              currentId = (await LoanManager.loanId()).toNumber()
          })
          //   it("1. Collateral(ERC20) no pre-collateral", async function () {
          //       collateralAsset = {
          //           category: ERC20_CATEGORY,
          //           assetAddress: CollateralTokenContract.address,
          //           id: ERC20_TOKENID,
          //           amount: COLLATERAL_AMOUNT,
          //       }
          //       preCollateral = 0

          //       await expect(
          //           LoanManager.createLoanRequest(
          //               collateralAsset,
          //               loanAsset,
          //               REPAY_AMOUNT,
          //               duration,
          //               expiration,
          //               preCollateral
          //           )
          //       )
          //           .to.emit(LoanManager, "LoanCreated")
          //           .and.changeTokenBalances(
          //               CollateralTokenContract,
          //               [borrower.address, VaultContract.address],
          //               [0, 0]
          //           )

          //       newId = (await LoanManager.loanId()).toNumber()
          //       assert(newId == currentId + 1)
          //   })

          it("2. Collateral(ERC20) with pre-collateral", async function () {
              borrowerBalance0 = await CollateralTokenContract.balanceOf(
                  borrower.address
              )
              vaultBalance0 = await CollateralTokenContract.balanceOf(
                  VaultContract.address
              )

              collateralAsset = {
                  category: ERC20_CATEGORY,
                  assetAddress: CollateralTokenContract.address,
                  id: ERC20_TOKENID,
                  amount: COLLATERAL_AMOUNT,
              }

              preCollateral = ethers.utils.parseUnits("100", DECIMALS)

              CollateralToken = CollateralTokenContract.connect(borrower)
              tx = await CollateralToken.approve(
                  VaultContract.address,
                  preCollateral
              )
              await tx.wait()

              tx = await LoanManager.createLoanRequest(
                  collateralAsset,
                  loanAsset,
                  REPAY_AMOUNT,
                  duration,
                  expiration,
                  preCollateral
              )

              await tx.wait()

              borrowerBalance1 = await CollateralTokenContract.balanceOf(
                  borrower.address
              )
              vaultBalance1 = await CollateralTokenContract.balanceOf(
                  VaultContract.address
              )

              assert(borrowerBalance1.eq(borrowerBalance0.sub(preCollateral)))
              assert(vaultBalance1.eq(vaultBalance0.add(preCollateral)))
          })

          //   it("3. Collateral(ERC721) with pre-collateral", async function () {
          //       // init transfer
          //       TestNFT = TestNFTContract.connect(deployer)
          //       tx = await TestNFT.safeMint(borrower.address)
          //       await tx.wait()
          //       tokenId = (await TestNFT.tokenIdCounter()).toNumber() - 1

          //       TestNFT = TestNFTContract.connect(borrower)
          //       tx = await TestNFT.approve(VaultContract.address, tokenId)

          //       collateralAsset = {
          //           category: ERC721_CATEGORY,
          //           assetAddress: TestNFT.address,
          //           id: tokenId,
          //           amount: 1,
          //       }
          //       preCollateral = ethers.utils.parseUnits("1", DECIMALS)

          //       tx = await LoanManager.createLoanRequest(
          //           collateralAsset,
          //           loanAsset,
          //           REPAY_AMOUNT,
          //           duration,
          //           expiration,
          //           preCollateral
          //       )

          //       await tx.wait()
          //       NftOwner = await TestNFT.ownerOf(tokenId)
          //       assert(NftOwner == VaultContract.address)
          //   })
      })
