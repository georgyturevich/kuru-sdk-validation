import { describe, it, expect } from '@jest/globals';
import { ethers } from "ethers";

import * as KuruConfig from '../config/config.json';
import * as KuruSdk from '@kuru-labs/kuru-sdk'
import {extractErrorMessage} from "@kuru-labs/kuru-sdk";
import { fail } from 'assert';


describe('Orders Test', () => {

    it('Place limit order like in examples', async () => {
        const { rpcUrl } = KuruConfig;

        const marketAddress = "0x05e6f736b5dedd60693fa806ce353156a1b73cf3";// CHOG-MON https://www.kuru.io/trade/0x05e6f736b5dedd60693fa806ce353156a1b73cf3
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        const privateKey = process.env.PRIVATE_KEY as string;
        const signer = new ethers.Wallet(privateKey, provider);

        console.log("Wallet address:", signer.getAddress())
        console.log(`Wallet balance: ${ethers.utils.formatEther(await signer.getBalance())} MON`)

        const marketParams = await KuruSdk.ParamFetcher.getMarketParams(provider, marketAddress);

        try{
            const receipt = await KuruSdk.GTC.placeLimit(
                signer,
                marketAddress,
                marketParams,
                {
                    price: "0.0000028400",
                    size: "10000",
                    isBuy: true,
                    postOnly: true
                }
            );
            console.log("Transaction hash:", receipt.transactionHash);
            expect(receipt).toBeDefined();
        } catch (e) {
            const errMsg = extractErrorMessage(e);
            console.error("Extracted error object: ", errMsg);
            fail(errMsg.message);
        }
    }, 600000)
});