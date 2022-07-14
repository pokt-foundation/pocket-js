import {
  MsgProtoAppStake,
  MsgProtoAppUnstake,
  MsgProtoNodeStakeTx,
  MsgProtoNodeUnjail,
  MsgProtoNodeUnstake,
  MsgProtoSend,
} from './models/msgs'
import {
  RawTxRequest,
  TransactionResponse,
} from '@pokt-foundation/pocketjs-types'
import { TxMsg } from './models/'

export type ChainID = 'mainnet' | 'testnet' | 'localnet'

export abstract class AbstractBuilder {
  /**
   * Gets the current chain ID this Transaction Builder has been initialized for.
   * @returns {ChainID} - 'mainnet', 'localnet', or 'testnet'.
   */
  abstract getChainID(): ChainID

  /**
   * Sets the chainID to one of the supported networks.
   */
  abstract setChainID(id: ChainID): void

  /**
   * Signs and creates a transaction object that can be submitted to the network given the parameters and called upon Msgs.
   * Will empty the msg list after succesful creation
   * @param {string} fee - The amount to pay as a fee for executing this transaction, in uPOKT (1 POKT = 1*10^6 uPOKT).
   * @param {string} memo - The memo field for this account
   * @returns {Promise<RawTxRequest>} - A Raw transaction Request which can be sent over the network.
   */
  abstract createTransaction({
    fee,
    memo,
    txMsg,
  }: {
    fee?: string | bigint
    memo?: string
    txMsg: TxMsg
  }): Promise<RawTxRequest>

  /**
   * Submit receives a valid transaction message, creates a Raw Transaction Request and sends it over the network.
   * @param {string} fee - The amount to pay as a fee for executing this transaction, in uPOKT (1 POKT = 1*10^6 uPOKT).
   * @param {string} memo - The memo field for this account
   * @param {TxMsg} txMsg - The transaction message to use for creating the RawTxRequest that will be sent over the network.
   * @returns {Promise<TransactionResponse>} - The Transaction Response from the network, containing the transaction hash.
   */
  abstract submit({
    fee,
    memo,
    txMsg,
  }: {
    fee?: string | bigint
    memo?: string
    txMsg: TxMsg
  }): Promise<TransactionResponse>

  /**
   * Submit receives an already made Raw Transaction Request and sends it over the network.
   * @param {RawTxRequest} tx - The Raw Transaction Request use for creating the RawTxRequest that will be sent over the network.
   * @returns {Promise<TransactionResponse>} - The Transaction Response from the network, containing the transaction hash.
   */
  abstract submitRawTransaction(tx: RawTxRequest): Promise<TransactionResponse>

  /**
   * Adds a MsgSend TxMsg for this transaction
   * @param {string} fromAddress - Origin address
   * @param {string} toAddress - Destination address
   * @param {string} amount - Amount to be sent, needs to be a valid number greater than 1 uPOKT.
   * @returns {MsgProtoSend} - The unsigned Send message.
   */
  abstract send({
    fromAddress,
    toAddress,
    amount,
  }: {
    fromAddress: string
    toAddress: string
    amount: string
  }): MsgProtoSend
  /**
   * Adds a MsgAppStake TxMsg for this transaction
   * @param {string} appPubKey - Application Public Key
   * @param {string[]} chains - Network identifier list to be requested by this app
   * @param {string} amount - the amount to stake, must be greater than or equal to 1 POKT
   * @returns {MsgProtoAppStake} - The unsigned App Stake message.
   */
  abstract appStake({
    appPubKey,
    chains,
    amount,
  }: {
    appPubKey: string
    chains: string[]
    amount: string
  }): MsgProtoAppStake

  /**
   * Adds a MsgBeginAppUnstake TxMsg for this transaction
   * @param {string} address - Address of the Application to unstake for
   * @returns {MsgProtoAppUnstake} - The unsigned App Unstake message.
   */
  abstract appUnstake(address: string): MsgProtoAppUnstake

  /**
   * Adds a NodeStake TxMsg for this transaction
   * @param {string} nodePubKey - Node Public key
   * @param {string} outputAddress - The address that the coins will be sent to when the node is unstaked
   * @param {string[]} chains - Network identifier list to be serviced by this node
   * @param {string} amount - the amount to stake, must be greater than or equal to 1 POKT
   * @param {URL} serviceURL - Node service url
   * @returns {MsgProtoNodeStakeTx} - The unsigned Node Stake message.
   */
  abstract nodeStake({
    nodePubKey,
    outputAddress,
    chains,
    amount,
    serviceURL,
  }: {
    nodePubKey: string
    outputAddress: string
    chains: string[]
    amount: string
    serviceURL: URL
  }): MsgProtoNodeStakeTx

  /**
   * Adds a MsgBeginUnstake TxMsg for this transaction
   * @param {string} nodeAddress - Address of the Node to unstake for
   * @param {string} signerAddress - The address that the coins will be sent to when the node is unstaked. Must be the same address entered when the node was staked
   * @returns {MsgProtoNodeUnstake} - The unsigned Node Unstake message.
   */
  abstract nodeUnstake({
    nodeAddress,
    signerAddress,
  }: {
    nodeAddress?: string
    signerAddress?: string
  }): MsgProtoNodeUnstake

  /**
   * Adds a MsgUnjail TxMsg for this transaction
   * @param {string} nodeAddress - Address of the Node to unjail
   * @returns {MsgProtoNodeUnjail} - The unsigned Node Unjail message.
   */
  abstract nodeUnjail({
    nodeAddress,
    signerAddress,
  }: {
    nodeAddress?: string
    signerAddress?: string
  }): MsgProtoNodeUnjail
}
