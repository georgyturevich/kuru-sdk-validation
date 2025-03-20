import { describe, it, expect } from '@jest/globals';
import { ethers } from "ethers";

import * as KuruConfig from '../config/config.json';


describe('Network Test', () => {

    it('Get block by timestamp', async () => {
        const { rpcUrl } = KuruConfig;

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log("Network:", network);

        // Function to find the block number closest to a given timestamp
        async function findBlockByTimestamp(provider: ethers.providers.JsonRpcProvider, targetTimestamp: number): Promise<number> {
            let fetchCount = 0;
            // Get the latest block
            const latestBlock = await provider.getBlock('latest');
            const now = Math.floor(Date.now() / 1000);
            let high = latestBlock.number;
            // A few blocks may be generated per second, using a higher multiplier to ensure we go back far enough
            let low = high - (now - targetTimestamp) * 5; // Taking into account multiple blocks per second
            
            // Binary search to find the block closest to the target timestamp
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                
                const midBlock = await provider.getBlock(mid);
                fetchCount++;
                
                // We don't return immediately on exact match since multiple blocks
                // may have the same timestamp, and we want the first one
                if (midBlock.timestamp < targetTimestamp) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            
            // At this point, high is the closest block with timestamp < targetTimestamp
            // and low is the closest block with timestamp >= targetTimestamp
            
            // First, check if we have a block with exactly the target timestamp
            let currentBlock = low;
            let exactMatch = false;
            
            // Find the first block with the target timestamp, if any
            while (currentBlock <= latestBlock.number) {
                const block = await provider.getBlock(currentBlock);
                fetchCount++;
                
                if (block.timestamp === targetTimestamp) {
                    exactMatch = true;
                    break;
                } else if (block.timestamp > targetTimestamp) {
                    break;
                }
                
                currentBlock++;
            }
            
            if (exactMatch) {
                console.log(`Fetch count: ${fetchCount}`);
                return currentBlock;
            }
            
            // If no exact match, find the closest block
            const highBlock = await provider.getBlock(high);
            fetchCount++;
            const lowBlock = low <= latestBlock.number ? await provider.getBlock(low) : null;
            fetchCount++;
            
            console.log(`Fetch count: ${fetchCount}`);
            if (!lowBlock) return high;
            
            const highDiff = Math.abs(highBlock.timestamp - targetTimestamp);
            const lowDiff = Math.abs(lowBlock.timestamp - targetTimestamp);
            
            return highDiff <= lowDiff ? high : low;
        }
        
        // Example usage
        const targetTimestamp = Math.floor(Date.now() / 1000) - 3600/4; // 15 minutes ago
        console.log(`Finding block for timestamp: ${targetTimestamp} (${new Date(targetTimestamp * 1000).toISOString()})`);
        
        const blockNumber = await findBlockByTimestamp(provider, targetTimestamp);
        const block = await provider.getBlock(blockNumber);
        
        console.log(`Found block #${blockNumber} with timestamp ${block.timestamp} (${new Date(block.timestamp * 1000).toISOString()})`);
        console.log(`Difference from target: ${Math.abs(block.timestamp - targetTimestamp)} seconds`);


        expect(1).toEqual(1)
    }, 100000);
});