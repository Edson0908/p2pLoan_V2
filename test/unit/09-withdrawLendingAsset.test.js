const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const getRequest = require("../../scripts/getRecordFromLog")

const ERC20_CATEGORY = 0
const ERC721_CATEGORY = 1
const ZEROADDRESS = "0x0000000000000000000000000000000000000000"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("【FUNCTION】withdrawLendingAsset", function () {
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

              CollateralTokenContract = await ethers.getContract(
                  "CollateralToken"
              )

              LendingTokenContract = await ethers.getContract("LendingToken")

              TestNFTContract = await ethers.getContract("TestNFT")
          })
          it("1. LoanStatus = REPAID, withdraw repayAmount, burn LoanNFT", async function () {
              let [id, obj] = getRequest(STATUS.REPAID, true, true)

              if (id >= 0) {
                  console.log("-----------------------------------------")
                  console.log(`Withdraw Asset ${id}`)
                  console.log(obj)
                  console.log("-----------------------------------------")

                  repayAmount = ethers.utils.parseUnits(
                      obj["repayAmount"],
                      DECIMALS
                  )

                  LenderBlanace_L0 = await LendingTokenContract.balanceOf(
                      lender.address
                  )

                  VaultBalance_L0 = await LendingTokenContract.balanceOf(
                      VaultContract.address
                  )

                  LoanNft = LoanNftContract.connect(lender)
                  await LoanNft.approve(LoanManagerContract.address, id)

                  LoanManager = LoanManagerContract.connect(lender)
                  await expect(LoanManager.withdrawLendingAsset(id))
                      .to.emit(LoanManager, "LoanClosed")
                      .and.emit(LoanNftContract, "Transfer")
                      .withArgs(lender.address, ZEROADDRESS, id)

                  LenderBlanace_L1 = await LendingTokenContract.balanceOf(
                      lender.address
                  )

                  VaultBalance_L1 = await LendingTokenContract.balanceOf(
                      VaultContract.address
                  )

                  newStatus = await LoanManager.getLoanStatus(id)

                  assert(newStatus == STATUS.CLOSED)

                  assert(LenderBlanace_L1.eq(LenderBlanace_L0.add(repayAmount)))
                  assert(VaultBalance_L1.eq(VaultBalance_L0.sub(repayAmount)))
              }
          })
          //   it("2. repay before dueTime, return ERC721 collateral", async function () {
          //       let [id, obj] = getRequest(STATUS.RUNNING, false, true)
          //       if (id >= 0) {
          //           console.log("-----------------------------------------")
          //           console.log(`Replay loan ${id}`)
          //           console.log(obj)
          //           console.log("-----------------------------------------")

          //           repayAmount = ethers.utils.parseUnits(
          //               obj["repayAmount"],
          //               DECIMALS
          //           )
          //           nftId = ethers.BigNumber.from(obj["collateral"]["id"])

          //           LendingToken = LendingTokenContract.connect(borrower)

          //           borrowerBlanace_L0 = await LendingTokenContract.balanceOf(
          //               borrower.address
          //           )

          //           VaultBalance_L0 = await LendingTokenContract.balanceOf(
          //               VaultContract.address
          //           )

          //           await LendingToken.approve(VaultContract.address, repayAmount)

          //           LoanManager = LoanManagerContract.connect(borrower)
          //           await expect(LoanManager.repayLoan(id)).to.emit(
          //               LoanManager,
          //               "LoanRepaid"
          //           )

          //           borrowerBlanace_L1 = await LendingTokenContract.balanceOf(
          //               borrower.address
          //           )

          //           VaultBalance_L1 = await LendingTokenContract.balanceOf(
          //               VaultContract.address
          //           )

          //           newStatus = await LoanManager.getLoanStatus(id)
          //           owner = await TestNFTContract.ownerOf(nftId)

          //           assert(newStatus == STATUS.REPAID)
          //           assert(
          //               borrowerBlanace_L1.eq(borrowerBlanace_L0.sub(repayAmount))
          //           )
          //           assert(VaultBalance_L1.eq(VaultBalance_L0.add(repayAmount)))
          //           assert(owner == borrower.address)
          //       }
          //   })

          //   it("3. repay after dueTime", async function () {
          //       let [id, obj] = getRequest(STATUS.RUNNING, true, true)

          //       if (id >= 0) {
          //           console.log("-----------------------------------------")
          //           console.log(`Replay loan ${id}`)
          //           console.log(obj)
          //           console.log("-----------------------------------------")

          //           LoanManager = LoanManagerContract.connect(borrower)
          //           await expect(LoanManager.repayLoan(id)).to.emit(
          //               LoanManager,
          //               "LoanViolated"
          //           )

          //           newStatus = await LoanManager.getLoanStatus(id)
          //           assert(newStatus == STATUS.VIOLATED)
          //       }
          //   })
      })
