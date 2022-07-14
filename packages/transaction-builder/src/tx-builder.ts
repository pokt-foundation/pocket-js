import { Buffer } from 'buffer'
import {
  MsgProtoAppStake,
  MsgProtoAppUnstake,
  MsgProtoNodeStakeTx,
  MsgProtoNodeUnjail,
  MsgProtoNodeUnstake,
  MsgProtoSend,
} from './models/msgs'
import { AbstractProvider } from '@pokt-foundation/pocketjs-abstract-provider'
import { AbstractSigner } from '@pokt-foundation/pocketjs-signer'
import {
  RawTxRequest,
  TransactionResponse,
} from '@pokt-foundation/pocketjs-types'
import { TxEncoderFactory } from './factory/tx-encoder-factory'
import { CoinDenom, TxMsg, TxSignature } from './models/'
import { InvalidChainIDError, NoProviderError, NoSignerError } from './errors'
import { AbstractBuilder } from './abstract-tx-builder'

export type ChainID = 'mainnet' | 'testnet' | 'localnet'

// Default Pocket Base fee.
// Using anything above 10k uPOKT means overpaying--there is no reason to do so,
// as the chain is merely focused on utility. No profit is gained by ordering txs
// in a block in a certain way.
export const DEFAULT_BASE_FEE = '10000'

/**
 * A Transaction builder lets you create transaction messages, sign them, and send them over the network.
 * Requires a properly initialized Provider and Signer to work.
 */
export class TransactionBuilder implements AbstractBuilder {
  private provider: AbstractProvider
  private signer: AbstractSigner
  private chainID: ChainID

  constructor({
    provider,
    signer,
    chainID = 'mainnet',
  }: {
    provider: AbstractProvider
    signer: AbstractSigner
    chainID: ChainID
  }) {
    if (!provider) {
      throw new NoProviderError('Please add a provider.')
    }
    if (!signer) {
      throw new NoSignerError('Please add a signer.')
    }

    this.provider = provider
    this.signer = signer
    this.chainID = chainID
  }

  /**
   * Gets the current chain ID this Transaction Builder has been initialized for.
   * @returns {ChainID} - 'mainnet', 'localnet', or 'testnet'.
   */
  public getChainID(): ChainID {
    return this.chainID
  }

  /**
   * Sets the chainID to one of the supported networks.
   */
  public setChainID(id: ChainID): void {
    if (id === 'mainnet' || id === 'testnet' || id === 'localnet') {
      this.chainID = id
    } else {
      throw new InvalidChainIDError(
        `Invalid ChainID. Must be "mainnet", "testnet", or "localnet".`
      )
    }
  }
  /**
   * Signs and creates a transaction object that can be submitted to the network given the parameters and called upon Msgs.
   * Will empty the msg list after succesful creation
   * @param {string} fee - The amount to pay as a fee for executing this transaction, in uPOKT (1 POKT = 1*10^6 uPOKT).
   * @param {string} memo - The memo field for this account
   * @returns {Promise<RawTxRequest>} - A Raw transaction Request which can be sent over the network.
   */
  public async createTransaction({
    fee = DEFAULT_BASE_FEE,
    memo = '',
    txMsg,
  }: {
    fee?: string | bigint
    memo?: string
    txMsg: TxMsg
  }): Promise<RawTxRequest> {
    // Let's make sure txMsg is defined.
    if (!txMsg) {
      throw new Error('txMsg should be defined.')
    }

    const entropy = Number(
      BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).toString()
    ).toString()

    const signer = TxEncoderFactory.createEncoder(
      entropy,
      this.chainID,
      txMsg,
      fee.toString(),
      CoinDenom.Upokt,
      memo
    )

    const bytesToSign = signer.marshalStdSignDoc()

    const txBytes = await this.signer.sign(bytesToSign.toString('hex'))

    const marshalledTx = new TxSignature(
      Buffer.from(this.signer.getPublicKey(), 'hex'),
      Buffer.from(txBytes, 'hex')
    )

    const rawHexBytes = signer.marshalStdTx(marshalledTx).toString('hex')

    return new RawTxRequest(this.signer.getAddress(), rawHexBytes)
  }

  /**
   * Submit receives a valid transaction message, creates a Raw Transaction Request and sends it over the network.
   * @param {string} fee - The amount to pay as a fee for executing this transaction, in uPOKT (1 POKT = 1*10^6 uPOKT).
   * @param {string} memo - The memo field for this account
   * @param {TxMsg} txMsg - The transaction message to use for creating the RawTxRequest that will be sent over the network.
   * @returns {Promise<TransactionResponse>} - The Transaction Response from the network, containing the transaction hash.
   */
  public async submit({
    fee = DEFAULT_BASE_FEE,
    memo = '',
    txMsg,
  }: {
    fee?: string | bigint
    memo?: string
    txMsg: TxMsg
  }): Promise<TransactionResponse> {
    const tx = await this.createTransaction({ fee, memo, txMsg })

    return await this.provider.sendTransaction(tx)
  }

  /**
   * Submit receives an already made Raw Transaction Request and sends it over the network.
   * @param {RawTxRequest} tx - The Raw Transaction Request use for creating the RawTxRequest that will be sent over the network.
   * @returns {Promise<TransactionResponse>} - The Transaction Response from the network, containing the transaction hash.
   */
  public async submitRawTransaction(
    tx: RawTxRequest
  ): Promise<TransactionResponse> {
    return await this.provider.sendTransaction(tx)
  }

  /**
   * Adds a MsgSend TxMsg for this transaction
   * @param {string} fromAddress - Origin address
   * @param {string} toAddress - Destination address
   * @param {string} amount - Amount to be sent, needs to be a valid number greater than 1 uPOKT.
   * @returns {MsgProtoSend} - The unsigned Send message.
   */
  public send({
    fromAddress = this.signer.getAddress(),
    toAddress,
    amount,
  }: {
    fromAddress?: string
    toAddress: string
    amount: string
  }): MsgProtoSend {
    return new MsgProtoSend(fromAddress, toAddress, amount)
  }

  /**
   * Adds a MsgAppStake TxMsg for this transaction
   * @param {string} appPubKey - Application Public Key
   * @param {string[]} chains - Network identifier list to be requested by this app
   * @param {string} amount - the amount to stake, must be greater than or equal to 1 POKT
   * @returns {MsgProtoAppStake} - The unsigned App Stake message.
   */
  public appStake({
    appPubKey,
    chains,
    amount,
  }: {
    appPubKey: string
    chains: string[]
    amount: string
  }): MsgProtoAppStake {
    return new MsgProtoAppStake(appPubKey, chains, amount)
  }

  /**
   * Adds a MsgBeginAppUnstake TxMsg for this transaction
   * @param {string} address - Address of the Application to unstake for
   * @returns {MsgProtoAppUnstake} - The unsigned App Unstake message.
   */
  public appUnstake(address: string): MsgProtoAppUnstake {
    return new MsgProtoAppUnstake(address)
  }

  /**
   * Adds a NodeStake TxMsg for this transaction
   * @param {string} nodePubKey - Node Public key
   * @param {string} outputAddress - The address that the coins will be sent to when the node is unstaked
   * @param {string[]} chains - Network identifier list to be serviced by this node
   * @param {string} amount - the amount to stake, must be greater than or equal to 1 POKT
   * @param {URL} serviceURL - Node service url
   * @returns {MsgProtoNodeStakeTx} - The unsigned Node Stake message.
   */
  public nodeStake({
    nodePubKey = this.signer.getPublicKey(),
    outputAddress = this.signer.getAddress(),
    chains,
    amount,
    serviceURL,
  }: {
    nodePubKey?: string
    outputAddress?: string
    chains: string[]
    amount: string
    serviceURL: URL
  }): MsgProtoNodeStakeTx {
    return new MsgProtoNodeStakeTx(
      nodePubKey,
      outputAddress,
      chains,
      amount,
      serviceURL
    )
  }

  /**
   * Adds a MsgBeginUnstake TxMsg for this transaction
   * @param {string} nodeAddress - Address of the Node to unstake for
   * @param {string} signerAddress - The address that the coins will be sent to when the node is unstaked. Must be the same address entered when the node was staked
   * @returns {MsgProtoNodeUnstake} - The unsigned Node Unstake message.
   */
  public nodeUnstake({
    nodeAddress = this.signer.getAddress(),
    signerAddress = this.signer.getAddress(),
  }: {
    nodeAddress?: string
    signerAddress?: string
  }): MsgProtoNodeUnstake {
    return new MsgProtoNodeUnstake(nodeAddress, signerAddress)
  }

  /**
   * Adds a MsgUnjail TxMsg for this transaction
   * @param {string} nodeAddress - Address of the Node to unjail
   * @param {string} signerAddress - The address of where the coins will be sent to when the node is unstaked (if it is ever). Necessary to unjail the node
   * @returns {MsgProtoNodeUnjail} - The unsigned Node Unjail message.
   */
  public nodeUnjail({
    nodeAddress = this.signer.getAddress(),
    signerAddress = this.signer.getAddress(),
  }: {
    nodeAddress?: string
    signerAddress?: string
  }): MsgProtoNodeUnjail {
    return new MsgProtoNodeUnjail(nodeAddress, signerAddress)
  }
}
