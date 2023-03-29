const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const getRequest = require("../../scripts/getRecordFromLog")

const ERC20_CATEGORY = 0
const ERC721_CATEGORY = 1

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("【FUNCTION】submitOffer", function () {
          let LoanManager, CollateralToken, LendingToken, TestNFT

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

              LendingTokenContract = await ethers.getContract("LendingToken")

              LendingToken = LendingTokenContract.connect(lender)
          })
          it("1. Repond loanRequest with Status.OPEN, transfer lendingTopken to Vault.", async function () {
              let [id, obj] = getRequest(STATUS.OPEN, true, true)

              if (id >= 0) {
                  console.log("-----------------------------------------")
                  console.log(`Repond request ${id}`)
                  console.log(obj)
                  console.log("-----------------------------------------")

                  lendingAmount = ethers.utils.parseUnits(
                      obj["loanAsset"]["amount"],
                      DECIMALS
                  )
                  await LendingToken.approve(
                      VaultContract.address,
                      lendingAmount
                  )

                  lenderBalance0 = await LendingToken.balanceOf(lender.address)
                  vaultBalance0 = await LendingToken.balanceOf(
                      VaultContract.address
                  )

                  LoanManager = LoanManagerContract.connect(lender)
                  await expect(LoanManager.submitOffer(id)).to.emit(
                      LoanManager,
                      "OfferSubmitted"
                  )

                  newStatus = await LoanManager.getLoanStatus(id)
                  owner = await LoanNftContract.ownerOf(id)

                  lenderBalance1 = await LendingToken.balanceOf(lender.address)
                  vaultBalance1 = await LendingToken.balanceOf(
                      VaultContract.address
                  )

                  assert(newStatus == STATUS.WAITING)
                  assert(owner == lender.address)
                  assert(lenderBalance1.eq(lenderBalance0.sub(lendingAmount)))
                  assert(vaultBalance1.eq(vaultBalance0.add(lendingAmount)))
              }
          })
      })
