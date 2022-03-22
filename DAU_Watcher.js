const Web3 = require('web3')
const fs = require("fs")
const {getBlockLessThanTimestamp} = require("./utils.js")
const magic = "0x539bdE0d7Dbd336b79148AA742883198BBF60342"
const abi = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
]
const MAX_LOOKUP_BLOCK_NUMBER = 10000
const ONE_DAY_IN_SECONDS = 60*60*24
let token
let web3
let startTimeString = "2022-3-12" //format of timeString: "yyyy-mm-dd"
let endTimeString = "2022-3-18" //format of timeString: "yyyy-mm-dd"

function setWeb3() {
    web3 = new Web3("https://arbitrum-mainnet.infura.io/v3/xxx")
    token = new web3.eth.Contract(abi, magic)
}

async function DAUWatcher() {
    setWeb3()
    const CSV_Data = ['Day,DAU']
    let startTime = getTimestampFromTimeString(startTimeString)
    let endTime = getTimestampFromTimeString(endTimeString)
    let days = (endTime - startTime) / ONE_DAY_IN_SECONDS
    console.log(`There is ${days} day(s) to query in total`)
    let startBlock = await getBlockLessThanTimestamp(startTime)
    //loop to get each day's information
    for(var i = 0; i < days; i++) {
        let endBlock = await getBlockLessThanTimestamp(startTime + ONE_DAY_IN_SECONDS * (i + 1))
        let num = await getDAU(startBlock, endBlock)
        CSV_Data.push((new Date((startTime + ONE_DAY_IN_SECONDS * i)*1000).toLocaleDateString("en-US")) + "," + num)
        startBlock = endBlock + 1
        console.log(((i/days).toFixed(2)*100)+"%")
    }
    //after geting each day's information, write to csv
    fs.writeFile("./data.csv", CSV_Data.join("\r\n"), (err) => {
        console.log(err || "")
    });
    console.log("done!")
}
async function getDAU(from, to) {
    let set = new Set()
    let midPoint
    
    do{
        midPoint = (from + MAX_LOOKUP_BLOCK_NUMBER) > to ? to : (from + MAX_LOOKUP_BLOCK_NUMBER)

        let txs = await token.getPastEvents('Transfer', {
            fromBlock: from,
            toBlock: midPoint
        });

        for(let i = 0; i < txs.length; i++) {
            set.add(txs[i].returnValues.from)
            set.add(txs[i].returnValues.to)
        }

        from = midPoint + 1
    } while(midPoint != to)
    return set.size;
}


function getTimestampFromTimeString(timeString) {
    let date = new Date(Date.parse(timeString.replace(/-/g, "/")))
    date = date.getTime()
    return date/1000
 }

 DAUWatcher()
