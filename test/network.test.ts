import { describe, it, expect } from '@jest/globals';
import { ethers } from "ethers";

import * as KuruConfig from '../config/config.json';
import {BlockTag} from "@ethersproject/abstract-provider";


describe('Network Test', () => {

    it('Get block by timestamp', async () => {
        const { rpcUrl } = KuruConfig;

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log("Network:", network);

        // Function to find the block number closest to a given timestamp
        async function findBlockByTimestamp(provider: ethers.providers.JsonRpcProvider, targetTimestamp: number): Promise<number> {
            let fetchCount = 0;

            // Cache to prevent refetching blocks
            const blockCache: Record<BlockTag, ethers.providers.Block> = {};

            // Helper function to get a block (using cache)
            const getBlock = async (blockNumber: BlockTag): Promise<ethers.providers.Block> => {
                if (blockCache[blockNumber]) return blockCache[blockNumber];
                fetchCount++;
                const block = await provider.getBlock(blockNumber);
                blockCache[blockNumber] = block;
                return block;
            };

            // Get the latest block
            const latestBlock = await getBlock('latest');
            const now = Math.floor(Date.now() / 1000);
            let high = latestBlock.number;

            // Calculate a more reasonable lower bound
            // Estimate based on average block time (safer with min value to avoid negative)
            let low = Math.max(0, high - (now - targetTimestamp) * 3);

            // First binary search phase - find the range where the target timestamp might be
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const midBlock = await getBlock(mid);

                if (midBlock.timestamp < targetTimestamp) {
                    low = mid + 1;
                } else if (midBlock.timestamp > targetTimestamp) {
                    high = mid - 1;
                } else {
                    // Exact match found - now find the first block with this timestamp
                    let firstBlockWithTimestamp = mid;
                    let current = mid - 1;

                    // Check a few blocks before to find the first with this timestamp
                    // This is more efficient than a full linear scan
                    while (current >= low) {
                        const block = await getBlock(current);
                        if (block.timestamp < targetTimestamp) break;
                        if (block.timestamp === targetTimestamp) firstBlockWithTimestamp = current;
                        current--;
                    }

                    console.log(`Fetch count: ${fetchCount}`);
                    return firstBlockWithTimestamp;
                }
            }

            // At this point:
            // - high is the highest block with timestamp < targetTimestamp
            // - low is the lowest block with timestamp > targetTimestamp

            // Get both candidates and return the closest one
            const highBlock = high >= 0 ? await getBlock(high) : null;
            const lowBlock = low <= latestBlock.number ? await getBlock(low) : null;

            console.log(`Fetch count: ${fetchCount}`);

            // Handle edge cases
            if (!highBlock) return low;
            if (!lowBlock) return high;

            // Return the block with timestamp closest to target
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