import {describe, it, expect} from '@jest/globals';
import { ethers } from "ethers";
import console from "node:console";

import * as KuruConfig from '../config/config.json';
import {testnetMarketAddresses} from "../src/constants/markets";
import { 
    findBlockByTimestamp, 
    retrieveRelatedTransactions, 
    printTransactionResults 
} from '../src/tools/network';


// Import market addresses


describe('Network Test', () => {
    it('Get block by timestamp and related transactions', async () => {
        expect(process.env.QUICK_NODE_HASH).not.toBe(undefined);

        let { rpcUrl } = KuruConfig;

        if (rpcUrl.includes("quiknode.pro")) {
            if (!rpcUrl.endsWith("/")) {
                rpcUrl += "/";
            }
            rpcUrl += process.env.QUICK_NODE_HASH + "/";
        }

        console.log("rpcUrl", rpcUrl);

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log("Network:", network);

        // Example usage
        const targetTimestamp = Math.floor(Date.now() / 1000) - 60 * 3;
        console.log(`Finding block for timestamp: ${targetTimestamp} (${new Date(targetTimestamp * 1000).toISOString()})`);
        
        const targetBlockNum = await findBlockByTimestamp(provider, targetTimestamp);
        const block = await provider.getBlock(targetBlockNum);
        const latestBlock = await provider.getBlock('latest');
        
        console.log(`Found block #${targetBlockNum} with timestamp ${block.timestamp} (${new Date(block.timestamp * 1000).toISOString()})`);
        console.log(`Difference from target: ${Math.abs(block.timestamp - targetTimestamp)} seconds`);
        console.log(`Amount of blocks: ${latestBlock.number - targetBlockNum}`);

        // Looking for transactions related to all contracts in testnetMarketAddresses
        console.log("Looking for transactions related to all contracts in testnetMarketAddresses:");
       
        
        // Retrieve all contract transactions in a single pass
        const startTime = Date.now();
        const {transactionsByContract, allRelatedTransactions} = await retrieveRelatedTransactions(
            provider,
            targetBlockNum,
            testnetMarketAddresses,
            400 // Max blocks
        );
        const executionTime = (Date.now() - startTime) / 1000;


        
        // Print results
        printTransactionResults(transactionsByContract, allRelatedTransactions, testnetMarketAddresses);

        console.log(`Execution time of retrieveRelatedTransactions: ${executionTime} seconds`);
        expect(1).toEqual(1);
    }, 1000 * 1000);
});