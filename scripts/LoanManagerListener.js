const { ethers } = require("hardhat")
const fs = require("fs")
const { logfile } = require("../helper-hardhat-config")

console.log(logfile)

let contract
const DECIMALS = 18

async function main() {
    const DECIMALS = 18
    // 获取合约实例
    contract = await ethers.getContract("LoanManager")

    // 监听事件
    contract.on("LoanCreated", async (_borrower, loanId, loanObj, event) => {
        console.log("!!!!event LoanCreated detected!!!!")
        console.log(event)
        await updateLog(loanId)
    })

    contract.on("LoanClosed", async (borrower, loanId, event) => {
        console.log("!!!!event LoanClosed detected!!!!")
        console.log(event)
        await updateLog(loanId)
    })

    contract.on("OfferSubmitted", async (lender, loanId, deadline, event) => {
        console.log("!!!!event OfferSubmitted detected!!!!")
        console.log(event)
        await updateLog(loanId)
    })

    contract.on("LoanUpdated", async (borrower, loanId, event) => {
        console.log("!!!!event LoanUpdated detected!!!!")
        console.log(event)
        await updateLog(loanId)
    })

    contract.on("OfferRevoked", async (lender, loanId, event) => {
        console.log("!!!!event OfferRevoked detected!!!!")
        console.log(event)
        await updateLog(loanId)
    })

    contract.on("LoanRepaid", async (borrower, loanId, event) => {
        console.log("!!!!event LoanRepaid detected!!!!")
        console.log(event)
        await updateLog(loanId)
    })

    contract.on("OfferAccepted", async (borrower, loanId, dueTime, event) => {
        console.log("!!!!event OfferAccepted detected!!!!")
        console.log(event)
        await updateLog(loanId)
    })

    contract.on("LoanViolated", async (borrower, loanId, event) => {
        console.log("!!!!event LoanViolated detected!!!!")
        console.log(event)
        await updateLog(loanId)
    })

    console.log("Listening for LoanManager events...")
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})

async function updateLog(id) {
    const input = await contract.getLoanObj(id)

    output = {
        borrower: input[9],
        collateral: {
            category: input[0][0].toString(),
            assetAddress: input[0][1],
            id: input[0][2].toString(),
            amount:
                input[0][0] == 1
                    ? input[0][3].toString()
                    : ethers.utils.formatUnits(input[0][3], DECIMALS),
        },
        loanAsset: {
            category: input[1][0].toString(),
            assetAddress: input[1][1],
            id: input[1][2].toString(),
            amount: ethers.utils.formatUnits(input[1][3], DECIMALS),
        },
        repayAmount: ethers.utils.formatUnits(input[2], DECIMALS),

        duration: input[3].toString(),
        expiration:
            input[4].toNumber() == 0
                ? "NA"
                : new Date(input[4].toNumber() * 1000).toLocaleString(),
        LoanStatus: input[5].toString(),
        collateralFilled: ethers.utils.formatUnits(input[6], DECIMALS),
        deadline:
            input[7].toNumber() == 0
                ? "NA"
                : new Date(input[7].toNumber() * 1000).toLocaleString(),
        dueTime:
            input[8].toNumber() == 0
                ? "NA"
                : new Date(input[8].toNumber() * 1000).toLocaleString(),
    }

    records = JSON.parse(fs.readFileSync(logfile, "utf8"))
    if (!id in records) {
        records[id].push(output)
    } else {
        records[id] = output
    }
    fs.writeFileSync(logfile, JSON.stringify(records))
}
