const fs = require("fs")
const { logfile } = require("../helper-hardhat-config")

const ERC20_CATEGORY = 0
const ERC721_CATEGORY = 1

module.exports = function getRequest(status, isERC20, preCollateral) {
    const records = JSON.parse(fs.readFileSync(logfile, "utf8"))

    //console.log(records)

    const ids = Object.keys(records)
    let found = false

    for (i = 0; i < ids.length; i++) {
        record = records[ids[i]]
        loanStatus = record["LoanStatus"]
        collateralFilled = record["collateralFilled"]
        category = record["collateral"]["category"]

        if (loanStatus == status) {
            if (isERC20) {
                if (preCollateral) {
                    if (
                        parseFloat(collateralFilled) > 0 &&
                        category == ERC20_CATEGORY
                    ) {
                        found = true
                        break
                    }
                } else {
                    if (
                        parseFloat(collateralFilled) == 0 &&
                        category == ERC20_CATEGORY
                    ) {
                        found = true
                        break
                    }
                }
            } else {
                if (preCollateral) {
                    if (
                        parseFloat(collateralFilled) > 0 &&
                        category == ERC721_CATEGORY
                    ) {
                        found = true
                        break
                    }
                } else {
                    if (
                        parseFloat(collateralFilled) == 0 &&
                        category == ERC721_CATEGORY
                    ) {
                        found = true
                        break
                    }
                }
            }
        }
    }
    if (found) {
        return [ids[i], record]
    } else return [-1, null]
}
