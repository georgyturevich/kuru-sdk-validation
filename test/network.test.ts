import { describe, it, expect } from '@jest/globals';
import { ethers } from "ethers";

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
        const { rpcUrl } = KuruConfig;

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log("Network:", network);

        // Example usage
        const targetTimestamp = Math.floor(Date.now() / 1000) - 3600/20; // 10 minutes ago
        console.log(`Finding block for timestamp: ${targetTimestamp} (${new Date(targetTimestamp * 1000).toISOString()})`);
        
        const targetBlockNum = await findBlockByTimestamp(provider, targetTimestamp);
        const block = await provider.getBlock(targetBlockNum);
        
        console.log(`Found block #${targetBlockNum} with timestamp ${block.timestamp} (${new Date(block.timestamp * 1000).toISOString()})`);
        console.log(`Difference from target: ${Math.abs(block.timestamp - targetTimestamp)} seconds`);

        // Looking for transactions related to all contracts in testnetMarketAddresses
        console.log("Looking for transactions related to all contracts in testnetMarketAddresses:");
        
        // Retrieve all contract transactions in a single pass
        const { transactionsByContract, allRelatedTransactions } = await retrieveRelatedTransactions(
            provider,
            targetBlockNum,
            testnetMarketAddresses,
            400 // Max blocks
        );
        
        // Print results
        printTransactionResults(transactionsByContract, allRelatedTransactions, testnetMarketAddresses);

        expect(1).toEqual(1);
    }, 1000 * 1000);
});