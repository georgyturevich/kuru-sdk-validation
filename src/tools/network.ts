import { ethers } from "ethers";
import { BlockTag } from "@ethersproject/abstract-provider";

/**
 * Finds the block number closest to a given timestamp using binary search
 * @param provider The ethers JsonRpcProvider
 * @param targetTimestamp The target timestamp to find a block for
 * @returns Promise resolving to the block number closest to the target timestamp
 */
export async function findBlockByTimestamp(provider: ethers.providers.JsonRpcProvider, targetTimestamp: number): Promise<number> {
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

/**
 * Checks if a transaction is related to any of the specified contracts
 * @param tx The transaction to check
 * @param contractAddresses Map of contract names to addresses
 * @returns Array of contract names that are related to this transaction
 */
export function getRelatedContracts(
    tx: ethers.providers.TransactionResponse, 
    contractAddresses: Record<string, string>
): string[] {
    const related: string[] = [];
    
    for (const [marketName, address] of Object.entries(contractAddresses)) {
        if (typeof address !== 'string') continue;
        
        const normalizedAddress = address.toLowerCase();
        // Check if the transaction is to/from the contract address
        if ((tx.to && tx.to.toLowerCase() === normalizedAddress) || 
            (tx.from && tx.from.toLowerCase() === normalizedAddress)) {
            related.push(marketName);
        }
    }
    
    return related;
}

/**
 * Retrieves transactions related to any of the specified contracts
 * @param provider The ethers JsonRpcProvider
 * @param startBlockNum The block number to start searching from
 * @param contractAddresses Map of contract names to addresses
 * @param maxBlocks The maximum number of blocks to scan
 * @returns Promise resolving to transaction data organized by contract
 */
export async function retrieveRelatedTransactions(
    provider: ethers.providers.JsonRpcProvider, 
    startBlockNum: number,
    contractAddresses: Record<string, string>,
    maxBlocks: number = 400 // Limit the number of blocks to scan
): Promise<{
    transactionsByContract: Record<string, ethers.providers.TransactionResponse[]>,
    allRelatedTransactions: ethers.providers.TransactionResponse[]
}> {
    const transactionsByContract: Record<string, ethers.providers.TransactionResponse[]> = {};
    const allRelatedTransactions: ethers.providers.TransactionResponse[] = [];
    
    // Initialize empty arrays for each contract
    for (const marketName of Object.keys(contractAddresses)) {
        transactionsByContract[marketName] = [];
    }
    
    const latestBlock = await provider.getBlock('latest');
    console.info("Latest block number", latestBlock.number);

    const endBlock = Math.min(startBlockNum + maxBlocks, latestBlock.number);
    
    console.log(`Scanning transactions from block ${startBlockNum} to ${endBlock} [total blocks: ${endBlock - startBlockNum}]...`);
    
    for (let blockNum = startBlockNum; blockNum <= endBlock; blockNum++) {
        const blockWithTxs = await provider.getBlockWithTransactions(blockNum);
        
        for (const tx of blockWithTxs.transactions) {
            const relatedContracts = getRelatedContracts(tx, contractAddresses);
            
            if (relatedContracts.length > 0) {
                // This transaction is related to at least one contract
                allRelatedTransactions.push(tx);
                
                // Add to each related contract's transaction list
                for (const contractName of relatedContracts) {
                    // Fix for TS2532: Check if the contract name exists in our map
                    if (transactionsByContract[contractName]) {
                        transactionsByContract[contractName].push(tx);
                    }
                }
            }
        }
        
        // Log progress every 10 blocks
        if (blockNum % 10 === 0) {
            console.log(`Scanned block ${blockNum}, found ${allRelatedTransactions.length} transactions so far`);
        }
    }
    
    // Sort all transactions by block number and index for chronological view
    allRelatedTransactions.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
            return (a.blockNumber ?? 0) - (b.blockNumber ?? 0);
        }
        // Fix for TS2339: The transactions may have different property names in different ethers versions
        // Using optional chaining and nullish coalescing for safety
        return ((a as any).transactionIndex ?? 0) - ((b as any).transactionIndex ?? 0);
    });
    
    return {
        transactionsByContract,
        allRelatedTransactions
    };
}

/**
 * Prints a summary and details of transactions found for contracts
 * @param transactionsByContract Map of transactions by contract name
 * @param allRelatedTransactions All transactions combined
 * @param contractAddresses Contract addresses used to determine relations
 */
export function printTransactionResults(
    transactionsByContract: Record<string, ethers.providers.TransactionResponse[]>,
    allRelatedTransactions: ethers.providers.TransactionResponse[],
    contractAddresses: Record<string, string>
): void {
    // Print summary of all transactions found
    console.log(`\n======== TRANSACTION SUMMARY ========`);
    console.log(`Total transactions found across all contracts: ${allRelatedTransactions.length}`);

    // Print summary by contract
    for (const [marketName, txs] of Object.entries(transactionsByContract)) {
        console.log(`${marketName}: ${txs.length} transactions`);
    }

    // Print detailed information for all transactions
    if (allRelatedTransactions.length > 0) {
        console.log(`\n======== TRANSACTION DETAILS ========`);
        allRelatedTransactions.forEach((tx, index) => {
            // Find which contract(s) this transaction is related to
            const relatedContracts = getRelatedContracts(tx, contractAddresses);
                
            console.log(`\nTransaction ${index + 1}:`);
            console.log(`- Related to contracts: ${relatedContracts.join(', ')}`);
            console.log(`- Hash: ${tx.hash}`);
            console.log(`- Block: ${tx.blockNumber}`);
            console.log(`- From: ${tx.from}`);
            console.log(`- To: ${tx.to ?? 'Contract Creation'}`);
            console.log(`- Value: ${ethers.utils.formatEther(tx.value)} ETH`);
            console.log(`- Gas Price: ${ethers.utils.formatUnits(tx.gasPrice || 0, 'gwei')} Gwei`);
            console.log(`- Nonce: ${tx.nonce}`);
        });
    } else {
        console.log("No related transactions found across any contracts. You may want to scan more blocks or check if the contract addresses are correct.");
    }
} 