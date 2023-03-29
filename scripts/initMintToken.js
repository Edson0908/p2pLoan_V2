const { ethers } = require("hardhat")

async function main() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const borrower = accounts[1]
    const lender = accounts[2]

    const INIT_AMOUNT = ethers.utils.parseUnits("100000", 18)

    const LendingToken = await ethers.getContract("LendingToken", deployer)
    const CollateralToken = await ethers.getContract(
        "CollateralToken",
        deployer
    )

    await LendingToken.mint(lender.address, INIT_AMOUNT)
    await LendingToken.mint(borrower.address, INIT_AMOUNT)
    await CollateralToken.mint(borrower.address, INIT_AMOUNT)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
