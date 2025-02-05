export type DaoMembersState = {
  role: Role;
  addresses: string[];
};

export type DaoGovernanceState = {
  approveOrigin: keyof typeof ApproveOrigin;
  proposalPeriod: string;
  proposalPeriodType: ProposalPeriod;
  votingPeriod: string;
  votingPeriodType: ProposalPeriod;
  enactmentPeriod: string;
  enactmentPeriodType: ProposalPeriod;
  voteLockingPeriod: string;
  voteLockingPeriodType: ProposalPeriod;
  launchPeriod: string;
  launchPeriodType: ProposalPeriod;
};

export type DaoInfoState = {
  name: string;
  purpose: string;
};

export type DaoTokenState = {
  name: string;
  symbol: string;
  type: TokenType;
  quantity: string;
  address: string;
};

export enum ApproveOrigin {
  '1/2' = '50%',
  '3/5' = '60%',
  '3/4' = '75%',
  '1/1' = '100%'
}

export enum ProposalPeriod {
  DAYS = 'Days',
  HOURS = 'Hours'
}

export enum TokenType {
  FUNGIBLE_TOKEN = 'Fungible Token',
  ETH_TOKEN = 'ETH Token Address'
}

export type Role = 'Council';

export type PeriodName =
  | 'proposalPeriod'
  | 'votingPeriod'
  | 'enactmentPeriod'
  | 'voteLockingPeriod'
  | 'launchPeriod';

export type PeriodTypeName =
  | 'proposalPeriodType'
  | 'votingPeriodType'
  | 'enactmentPeriodType'
  | 'voteLockingPeriodType'
  | 'launchPeriodType';

export type PeriodInputType = {
  title: string;
  subtitle: string;
  label: string;
  periodName: PeriodName;
  periodTypeName: PeriodTypeName;
};
