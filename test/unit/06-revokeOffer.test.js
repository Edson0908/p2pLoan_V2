const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const getRequest = require("../../scripts/getRecordFromLog")

const ERC20_CATEGORY = 0
const ERC721_CATEGORY = 1
const ZEROADDRESS = "0x0000000000000000000000000000000000000000"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("【FUNCTION】revokeOffer", function () {
          let LoanManager, CollateralToken, LendingToken, TestNFT, LoanNft

          let LoanManagerContract,
              VaultContract,
              LoanNftContract,
              CollateralTokenContract,
              LendingTokenContract,
              TestNFTContract

          const DECIMALS = 18
          const LENDING_AMOUNT = ethers.utils.parseUnits("20000000", DECIMALS)

          const STATUS = {
              CLOSED: 0,
              OPEN: 1,
              WAITING: 2,
              RUNNING: 3,
              REPAID: 4,
              VIOLATED: 5,
          }
          beforeEach(async () => {
              // get signers
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              borrower = accounts[1]
              lender = accounts[2]

              // get Contract instants
              LoanManagerContract = await ethers.getContract("LoanManager")
              VaultContract = await ethers.getContractAt(
                  "Vault",
                  await LoanManagerContract.VAULT()
              )

              LoanNftContract = await ethers.getContractAt(
                  "LoanNft",
                  await LoanManagerContract.LOAN()
              )
              LoanNft = LoanNftContract.connect(lender)

              LendingTokenContract = await ethers.getContract("LendingToken")
          })
          it("1. Revoke Offfer with Status.WAITING, return lendingTopken to lender.", async function () {
              let [id, obj] = getRequest(STATUS.WAITING, false, true)

              if (id >= 0) {
                  console.log("-----------------------------------------")
                  console.log(`Revoke offer ${id}`)
                  console.log(obj)
                  console.log("-----------------------------------------")

                  lendingAmount = ethers.utils.parseUnits(
                      obj["loanAsset"]["amount"],
                      DECIMALS
                  )

                  lenderBalance0 = await LendingTokenContract.balanceOf(
                      lender.address
                  )
                  vaultBalance0 = await LendingTokenContract.balanceOf(
                      VaultContract.address
                  )

                  tx = await LoanNft.approve(LoanManagerContract.address, id)
                  await tx.wait()

                  LoanManager = LoanManagerContract.connect(lender)
                  await expect(LoanManager.revokeOffer(id))
                      .to.emit(LoanManager, "OfferRevoked")
                      .and.emit(LoanNftContract, "Transfer")
                      .withArgs(lender.address, ZEROADDRESS, id)

                  newStatus = await LoanManager.getLoanStatus(id)

                  lenderBalance1 = await LendingTokenContract.balanceOf(
                      lender.address
                  )
                  vaultBalance1 = await LendingTokenContract.balanceOf(
                      VaultContract.address
                  )

                  assert(newStatus == STATUS.OPEN)
                  assert(lenderBalance1.eq(lenderBalance0.add(lendingAmount)))
                  assert(vaultBalance1.eq(vaultBalance0.sub(lendingAmount)))
              }
          })
      })
