const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("【FUNCTION】constructor", function () {
          let LoanManagerContract,
              VaultContract,
              LoanNftContract,
              CollateralTokenContract,
              LendingTokenContract,
              TestNFTContract

          const ZEROADDRESS = "0x0000000000000000000000000000000000000000"

          beforeEach(async () => {
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
              LoanNftContract = await ethers.getContractAt(
                  "LoanNft",
                  await LoanManagerContract.LOAN()
              )
          })

          it("VAULT address saved", async function () {
              addr = await LoanManagerContract.VAULT()
              assert(addr != ZEROADDRESS)
          })
          it("LoanNFT address saved", async function () {
              addr = await LoanManagerContract.LOAN()
              assert(addr != ZEROADDRESS)
          })
      })
