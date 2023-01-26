import type { Struct, u32, u128, Bytes } from '@polkadot/types';
import type { Votes } from '@polkadot/types/interfaces';

type DaoPolicyProportionType = 'AtLeast' | 'MoreThan';

type DaoPolicyProportion = {
  type: DaoPolicyProportionType;
  proportion: number[];
};

type CreateDaoPolicy = {
  proposal_period: number;
  approve_origin: DaoPolicyProportion;
};

type CreateDaoTokenMetadata = {
  name: string;
  symbol: string;
  decimals: number;
};

type CreateDaoToken = {
  token_id: number;
  min_balance?: string;
  initial_balance: string;
  metadata: CreateDaoTokenMetadata;
};

export type CreateDaoInput = {
  name: string;
  purpose: string;
  metadata: string;
  policy: CreateDaoPolicy;
  token?: CreateDaoToken;
  token_address?: string;
};

export interface DaoCodec extends Struct {
  readonly accountId: Bytes;
  readonly founder: Bytes;
  readonly token: DaoTokenVariantCodec;
  readonly config: DaoConfig;
}

export type ProposalArgsCodec = [u32, u128, Bytes];

export interface ProposalCodec extends Struct {
  readonly method: ProposalMethod;
  readonly section: Bytes;
  readonly args: ProposalArgsCodec;
}

export interface VoteCodec extends Votes {}

export type VoteMeta = {
  ayes: string[];
  nays: string[];
  threshold: number;
  index: number;
  end: number;
  hash: string;
};

export type DaoConfig = {
  name: string;
  purpose: string;
  metadata: string;
};

export type DaoInfo = {
  token: DaoTokenVariant;
  founder: string;
  accountId: string;
  config: DaoConfig;
};

export type DAO = {
  id: string;
  dao: DaoInfo;
};

export type DaoToken = {
  name: string;
  symbol: string;
  decimals: number;
  quantity: string;
};

export type DaoTokenVariantCodec = {
  asEthTokenAddress: Bytes;
  asFungibleToken: u32;
  isEthTokenAddress: boolean;
  isFungibleToken: boolean;
};

export type DaoTokenVariant = {
  FungibleToken?: number;
  EthTokenAddress?: string;
};

export type MemberMeta = {
  address: string;
  name: string;
};

export interface BaseProposal {
  dao_id: number;
}

export interface ProposalTransfer extends BaseProposal {
  amount: bigint;
  beneficiary: string;
}

export interface ProposalMember extends BaseProposal {
  who: string;
}

export type ProposalArgs = ProposalTransfer | ProposalMember;

export type ProposalMeta = {
  hash: string;
  method: ProposalMethod;
  section: string;
  args: ProposalArgs;
};

export type ProposalMethod =
  | 'addMember'
  | 'removeMember'
  | 'spend'
  | 'transferToken';
