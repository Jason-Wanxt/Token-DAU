const axios = require('axios');
const SLEEP_TIMER = 1000

const getBlockLessThanTimestamp = async (blockTimestamp) => {
    const data = JSON.stringify({
        query: `query MyQuery {
            allBlockHeaders(
                first: 1
                orderBy: BLOCK_NUMBER_DESC
                filter: {
                  blockTimestamp: {
                    lessThanOrEqualTo: "` + blockTimestamp +`"
                  }
                }
              ) {
                nodes {
                  blockNumber
                  blockTimestamp
                }
              }
      }`,
        variables: {}
    });
    const config = {
        method: 'post',
        url: 'https://arb1-indexer.arbitrum.io/graphql',
        headers: { 
            'Content-Type': 'application/json'
        },
        data : data
    };

    const res = await axios(config)
    if(res.status != 200) {
        console.log("some error happens, will try again")
        await sleep(SLEEP_TIMER)
        return getBlockLessThanTimestamp(blockTimestamp)
    }
    if(!res.data) throw new Error("No data")
    if(!res.data.data) throw new Error("No data data")
    
    return Number(res.data.data.allBlockHeaders.nodes[0].blockNumber);
}

exports.getBlockLessThanTimestamp = getBlockLessThanTimestamp
