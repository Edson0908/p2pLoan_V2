const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const getRequest = require("../../scripts/getRecordFromLog")

const ERC20_CATEGORY = 0
const ERC721_CATEGORY = 1
const ZEROADDRESS = "0x0000000000000000000000000000000000000000"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("【FUNCTION】accpetOffer", function () {
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
          it("1. accept Offfer with Status.WAITING, transfer remaining ERC20 collateral.", async function () {
              let [id, obj] = getRequest(STATUS.WAITING, true, true)

              if (id >= 0) {
                  console.log("-----------------------------------------")
                  console.log(`Accept offer ${id}`)
                  console.log(obj)
                  console.log("-----------------------------------------")

                  collateralAmount = ethers.utils.parseUnits(
                      obj["collateral"]["amount"],
                      DECIMALS
                  )
                  lendingAmount = ethers.utils.parseUnits(
                      obj["loanAsset"]["amount"],
                      DECIMALS
                  )
                  filledAmount = ethers.utils.parseUnits(
                      obj["collateralFilled"],
                      DECIMALS
                  )
                  remainingAmount = collateralAmount.sub(filledAmount)

                  CollateralToken = CollateralTokenContract.connect(borrower)

                  await CollateralToken.approve(
                      VaultContract.address,
                      remainingAmount
                  )

                  borrowerBlanace_C0 = await CollateralTokenContract.balanceOf(
                      borrower.address
                  )
                  borrowerBlanace_L0 = await LendingTokenContract.balanceOf(
                      borrower.address
                  )

                  VaultBalance_C0 = await CollateralTokenContract.balanceOf(
                      VaultContract.address
                  )

                  VaultBalance_L0 = await LendingTokenContract.balanceOf(
                      VaultContract.address
                  )

                  LoanManager = LoanManagerContract.connect(borrower)
                  await expect(LoanManager.acceptOffer(id)).to.emit(
                      LoanManager,
                      "OfferAccepted"
                  )

                  borrowerBlanace_C1 = await CollateralTokenContract.balanceOf(
                      borrower.address
                  )
                  borrowerBlanace_L1 = await LendingTokenContract.balanceOf(
                      borrower.address
                  )

                  VaultBalance_C1 = await CollateralTokenContract.balanceOf(
                      VaultContract.address
                  )

                  VaultBalance_L1 = await LendingTokenContract.balanceOf(
                      VaultContract.address
                  )

                  newStatus = await LoanManager.getLoanStatus(id)

                  assert(newStatus == STATUS.RUNNING)
                  assert(
                      borrowerBlanace_C1.eq(
                          borrowerBlanace_C0.sub(remainingAmount)
                      )
                  )
                  assert(
                      VaultBalance_C1.eq(VaultBalance_C0.add(remainingAmount))
                  )
                  assert(
                      borrowerBlanace_L1.eq(
                          borrowerBlanace_L0.add(lendingAmount)
                      )
                  )
                  assert(VaultBalance_L1.eq(VaultBalance_L0.sub(lendingAmount)))
              }
          })
          //   it("2. accept Offfer with Status.WAITING, transfer ERC721 if necessary.", async function () {
          //       let [id, obj] = getRequest(STATUS.WAITING, false, true)
          //       if (id >= 0) {
          //           console.log("-----------------------------------------")
          //           console.log(`Accept offer ${id}`)
          //           console.log(obj)
          //           console.log("-----------------------------------------")

          //           if (parseFloat(obj["collateralFilled"]) == 0) {
          //           }

          //           lendingAmount = ethers.utils.parseUnits(
          //               obj["loanAsset"]["amount"],
          //               DECIMALS
          //           )

          //           borrowerBlanace_L0 = await LendingTokenContract.balanceOf(
          //               borrower.address
          //           )
          //           VaultBalance_L0 = await LendingTokenContract.balanceOf(
          //               VaultContract.address
          //           )
          //           borrowerBlanace_N0 = await TestNFTContract.balanceOf(
          //               borrower.address
          //           )
          //           VaultBalance_N0 = await TestNFTContract.balanceOf(
          //               VaultContract.address
          //           )

          //           LoanManager = LoanManagerContract.connect(borrower)
          //           await expect(LoanManager.acceptOffer(id)).to.emit(
          //               LoanManager,
          //               "OfferAccepted"
          //           )

          //           borrowerBlanace_L1 = await LendingTokenContract.balanceOf(
          //               borrower.address
          //           )
          //           VaultBalance_L1 = await LendingTokenContract.balanceOf(
          //               VaultContract.address
          //           )
          //           borrowerBlanace_N1 = await TestNFTContract.balanceOf(
          //               borrower.address
          //           )
          //           VaultBalance_N1 = await TestNFTContract.balanceOf(
          //               VaultContract.address
          //           )
          //           newStatus = await LoanManager.getLoanStatus(id)
          //           assert(newStatus == STATUS.RUNNING)
          //           assert(
          //               borrowerBlanace_L1.eq(
          //                   borrowerBlanace_L0.add(lendingAmount)
          //               )
          //           )
          //           assert(VaultBalance_L1.eq(VaultBalance_L0.sub(lendingAmount)))
          //           if (parseFloat(obj["collateralFilled"]) == 0) {
          //               assert(
          //                   borrowerBlanace_N0.toNumber() ==
          //                       borrowerBlanace_N1.toNumber() + 1
          //               )
          //               ssert(
          //                   VaultBalance_N1.toNumber() ==
          //                       VaultBalance_N0.toNumber() + 1
          //               )
          //           }
          //       }
          //   })
      })
