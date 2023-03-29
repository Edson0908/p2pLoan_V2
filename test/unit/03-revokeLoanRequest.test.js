const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const getRequest = require("../../scripts/getRecordFromLog")

const ERC20_CATEGORY = 0
const ERC721_CATEGORY = 1

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("【FUNCTION】revokeLoanRequest", function () {
          let LoanManager

          let LoanManagerContract,
              VaultContract,
              CollateralTokenContract,
              TestNFTContract

          const DECIMALS = 18

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

              // get Contract instants
              LoanManagerContract = await ethers.getContract("LoanManager")
              CollateralTokenContract = await ethers.getContract(
                  "CollateralToken"
              )
              TestNFTContract = await ethers.getContract("TestNFT")
              VaultContract = await ethers.getContractAt(
                  "Vault",
                  await LoanManagerContract.VAULT()
              )
          })

          it("1. Close loanRequest with Status.OPEN, return ERC20 collateral.", async function () {
              let [id, obj] = getRequest(STATUS.OPEN, true, true)
              if (id >= 0) {
                  collateralFilled = ethers.utils.parseUnits(
                      obj["collateralFilled"],
                      DECIMALS
                  )
                  borrowerBalance0 = await CollateralTokenContract.balanceOf(
                      borrower.address
                  )
                  vaultBalance0 = await CollateralTokenContract.balanceOf(
                      VaultContract.address
                  )

                  LoanManager = LoanManagerContract.connect(borrower)
                  await expect(LoanManager.revokeLoanRequest(id)).to.emit(
                      LoanManager,
                      "LoanClosed"
                  )
                  newStatus = await LoanManager.getLoanStatus(id)

                  borrowerBalance1 = await CollateralTokenContract.balanceOf(
                      borrower.address
                  )
                  vaultBalance1 = await CollateralTokenContract.balanceOf(
                      VaultContract.address
                  )

                  assert(newStatus.toString() == STATUS.CLOSED)
                  assert(
                      borrowerBalance1.eq(
                          borrowerBalance0.add(collateralFilled)
                      )
                  )
                  assert(vaultBalance1.eq(vaultBalance0.sub(collateralFilled)))
              }
          })

          it("2. Close loanRequest with Status.OPEN, return ERC721 collateral.", async function () {
              let [id, obj] = getRequest(STATUS.OPEN, false, true)
              if (id >= 0) {
                  nftId = ethers.BigNumber.from(obj["collateral"]["id"])
                  LoanManager = LoanManagerContract.connect(borrower)
                  tx = await LoanManager.revokeLoanRequest(id)
                  await tx.wait()
                  nftOwner = await TestNFTContract.ownerOf(nftId)
                  assert(nftOwner == borrower.address)
              }
          })
          it("3. Revert with status other than Status.OPEN", async function () {
              let [id, obj] = getRequest(STATUS.CLOSED, false, false)
              if (id >= 0) {
                  LoanManager = LoanManagerContract.connect(borrower)
                  await expect(LoanManager.revokeLoanRequest(id)).to.be.reverted
              }
          })
          it("4. Revert with msg.sender other than borrower", async function () {
              let [id, obj] = getRequest(STATUS.OPEN, true, false)
              if (id >= 0) {
                  LoanManager = LoanManagerContract.connect(deployer)
                  await expect(LoanManager.revokeLoanRequest(id)).to.be.reverted
              }
          })
      })
