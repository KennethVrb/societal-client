import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-toastify';

import { useAtomValue } from 'jotai';
import { apiAtom, keyringAtom } from 'store/api';
import { daosAtom } from 'store/dao';
import {
  accountsAtom,
  metamaskAccountAtom,
  substrateAccountAtom
} from 'store/account';

import { useDaoContract } from 'hooks/useDaoContract';
import { ssToEvmAddress } from 'utils/ssToEvmAddress';
import { keyringAddExternal } from 'utils/keyringAddExternal';
import { convertTimeToBlock } from 'utils/convertTimeToBlock';
import { formLinkByDaoId } from 'utils/formLinkByDaoId';

import { evmToAddress, isEthereumAddress } from '@polkadot/util-crypto';
import { stringToHex } from '@polkadot/util';

import type { Option, u32 } from '@polkadot/types';
import type { CreateDaoInput, DaoCodec } from 'types';

import { Typography } from 'components/ui-kit/Typography';
import { Button } from 'components/ui-kit/Button';
import { Notification } from 'components/ui-kit/Notifications';
import { TxButton } from 'components/TxButton';
import {
  DaoGovernanceState,
  DaoInfoState,
  DaoMembersState,
  DaoTokenState,
  ProposalPeriod,
  TokenType
} from './types';
import { DaoInfo } from './DaoInfo';
import { DaoMembers } from './DaoMembers';
import { DaoToken } from './DaoToken';
import { DaoGovernance } from './DaoGovernance';

import styles from './CreateDAO.module.scss';

const initialDaoInfoState: DaoInfoState = {
  name: '',
  purpose: ''
};

const initialDaoTokenState: DaoTokenState = {
  name: '',
  type: TokenType.FUNGIBLE_TOKEN,
  quantity: '',
  address: '',
  symbol: ''
};

const initialDaoGovernanceState: DaoGovernanceState = {
  approveOrigin: '1/2',
  enactmentPeriod: '',
  launchPeriod: '',
  proposalPeriod: '',
  voteLockingPeriod: '',
  votingPeriod: '',
  proposalPeriodType: ProposalPeriod.DAYS,
  enactmentPeriodType: ProposalPeriod.DAYS,
  launchPeriodType: ProposalPeriod.DAYS,
  voteLockingPeriodType: ProposalPeriod.DAYS,
  votingPeriodType: ProposalPeriod.DAYS
};

const initialDaoMembersState: DaoMembersState = {
  role: 'Council',
  addresses: ['']
};

export function CreateDAO() {
  const router = useRouter();
  const [nextDaoId, setNextDaoId] = useState<number>(0);
  const [daoInfo, setDaoInfo] = useState<DaoInfoState>(initialDaoInfoState);
  const [daoToken, setDaoToken] = useState<DaoTokenState>(initialDaoTokenState);
  const [daoGovernance, setDaoGovernance] = useState<DaoGovernanceState>(
    initialDaoGovernanceState
  );
  const [daoMembers, setDaoMembers] = useState<DaoMembersState>(
    initialDaoMembersState
  );
  const api = useAtomValue(apiAtom);
  const keyring = useAtomValue(keyringAtom);
  const daos = useAtomValue(daosAtom);
  const accounts = useAtomValue(accountsAtom);
  const metamaskSigner = useAtomValue(metamaskAccountAtom);
  const substrateAccount = useAtomValue(substrateAccountAtom);

  const [createdDaoId, setCreatedDaoId] = useState<number | null>(null);
  const [proposedDaoId, setProposedDaoId] = useState<number | null>(null);
  const daoCreatedRef = useRef<boolean>(false);

  const daoContract = useDaoContract();

  useEffect(() => {
    if (!daoCreatedRef.current || createdDaoId === null) {
      return;
    }

    const currentDao = daos?.find((x) => parseInt(x.id, 10) === createdDaoId);
    if (!currentDao) {
      return;
    }

    toast.success(
      <Notification
        title="You've successfully created a new DAO"
        body="You can create new DAO and perform other actions."
        variant="success"
      />
    );
    router.push(formLinkByDaoId(currentDao.id, 'dashboard'));
  }, [createdDaoId, daos, router]);

  useEffect(() => {
    if (proposedDaoId === null) {
      return undefined;
    }

    let unsubscribe: any | null = null;
    api?.query.dao
      .daos<Option<DaoCodec>>(
        proposedDaoId,
        async (_proposedDao: Option<DaoCodec>) => {
          if (_proposedDao.isEmpty) {
            return;
          }

          const founder = _proposedDao.value.founder.toString();
          const address = metamaskSigner
            ? await metamaskSigner?.getAddress()
            : substrateAccount?.address;

          if (!address) {
            return;
          }

          const substrateAddress = metamaskSigner
            ? evmToAddress(address)
            : address;
          if (founder !== substrateAddress || !daoCreatedRef.current) {
            return;
          }

          setCreatedDaoId(proposedDaoId);
        }
      )
      .then((unsub) => {
        unsubscribe = unsub;
      })
      // eslint-disable-next-line no-console
      .catch(console.error);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [
    api?.query.dao,
    metamaskSigner,
    proposedDaoId,
    setCreatedDaoId,
    substrateAccount?.address
  ]);

  useEffect(() => {
    let unsubscribe: any | null = null;

    api?.query.dao
      .nextDaoId<u32>((_nextDaoId: u32) => setNextDaoId(_nextDaoId.toNumber()))
      .then((unsub) => {
        unsubscribe = unsub;
      })
      // eslint-disable-next-line no-console
      .catch(console.error);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api, metamaskSigner, nextDaoId]);

  const handleTransform = () => {
    if (nextDaoId === null || !keyring) {
      return [];
    }

    const initial_balance = daoToken.quantity;
    const token_id = nextDaoId;
    const proposal_period = convertTimeToBlock(
      daoGovernance.proposalPeriod,
      daoGovernance.proposalPeriodType
    );
    const enactment_period = convertTimeToBlock(
      daoGovernance.enactmentPeriod,
      daoGovernance.enactmentPeriodType
    );
    const launch_period = convertTimeToBlock(
      daoGovernance.launchPeriod,
      daoGovernance.launchPeriodType
    );
    const voting_period = convertTimeToBlock(
      daoGovernance.votingPeriod,
      daoGovernance.votingPeriodType
    );
    const vote_locking_period = convertTimeToBlock(
      daoGovernance.voteLockingPeriod,
      daoGovernance.voteLockingPeriodType
    );
    const cooloff_period = convertTimeToBlock(
      daoGovernance.enactmentPeriod,
      daoGovernance.enactmentPeriodType
    );

    const proportion = daoGovernance.approveOrigin
      .split('/')
      .map((x) => parseInt(x, 10));

    const data: CreateDaoInput = {
      name: daoInfo.name.trim(),
      purpose: daoInfo.purpose.trim(),
      metadata: 'metadata',
      policy: {
        proposal_period,
        approve_origin: { type: 'AtLeast', proportion },
        governance: {
          GovernanceV1: {
            enactment_period,
            launch_period,
            voting_period,
            vote_locking_period,
            fast_track_voting_period: 30,
            cooloff_period,
            minimum_deposit: 1
          }
        }
      }
    };

    switch (daoToken.type) {
      case TokenType.ETH_TOKEN: {
        data.token_address = daoToken.address;
        break;
      }
      case TokenType.FUNGIBLE_TOKEN: {
        data.token = {
          token_id,
          initial_balance,
          metadata: {
            name: daoToken.name.trim(),
            symbol: daoToken.symbol.trim(),
            decimals: 10
          }
        };
        break;
      }
      default: {
        // eslint-disable-next-line no-console
        console.error(`Token type ${daoToken.type} does not exist`);
      }
    }

    const _members = daoMembers.addresses
      .filter((_address) => _address.length > 0)
      .map((_address) => {
        const _foundAccount = accounts?.find(
          (_account) => _account.address === _address
        );

        if (_foundAccount) {
          if (_foundAccount.meta.isEthereum) {
            return _foundAccount.meta.ethAddress;
          }
        }

        // TODO: re-work this
        if (
          _foundAccount?.type === 'sr25519' ||
          _foundAccount?.type === 'ed25519'
        ) {
          return _address;
        }

        if (isEthereumAddress(_address)) {
          keyringAddExternal(keyring, _address);
          return _address.trim();
        }

        return ssToEvmAddress(_address);
      });

    return [_members, [], stringToHex(JSON.stringify(data).trim())];
  };

  const handleDaoEthereum = async () => {
    if (!daoContract || !metamaskSigner) {
      return;
    }

    const data = handleTransform();

    try {
      await daoContract
        .connect(metamaskSigner)
        .createDao(...data, { gasLimit: 3000000 });
      daoCreatedRef.current = true;
      setProposedDaoId(nextDaoId);
      toast.success(
        <Notification
          title="Transaction created"
          body="DAO will be created soon."
          variant="success"
        />
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);

      toast.error(
        <Notification
          title="Transaction declined"
          body="Transaction was declined."
          variant="error"
        />
      );
    }
  };

  const handleOnSuccess = async () => {
    daoCreatedRef.current = true;
    setProposedDaoId(nextDaoId);
    toast.success(
      <Notification
        title="Transaction created"
        body="DAO will be created soon."
        variant="success"
      />
    );
  };

  const disabled =
    !daoInfo.name ||
    !daoInfo.purpose ||
    (daoToken.type === TokenType.FUNGIBLE_TOKEN &&
      (!daoToken.name || !daoToken.symbol)) ||
    (daoToken.type === TokenType.ETH_TOKEN && !daoToken.address) ||
    !daoMembers.role ||
    !daoGovernance.proposalPeriod ||
    !daoGovernance.proposalPeriodType;

  return (
    <div className={styles.container}>
      <Link href="/" className={styles['cancel-button']}>
        <Button variant="outlined" color="destructive" size="sm">
          Cancel DAO creation
        </Button>
      </Link>

      <div className={styles.content}>
        <Typography variant="h1" className={styles.title}>
          Create DAO
        </Typography>

        <DaoInfo state={daoInfo} setState={setDaoInfo} />
        <DaoMembers state={daoMembers} setState={setDaoMembers} />

        <DaoToken state={daoToken} setState={setDaoToken} />

        <DaoGovernance state={daoGovernance} setState={setDaoGovernance} />

        <div className={styles['create-proposal']}>
          {substrateAccount ? (
            <TxButton
              onSuccess={handleOnSuccess}
              disabled={disabled}
              accountId={substrateAccount?.address}
              params={handleTransform}
              tx={api?.tx.dao.createDao}
              className={styles['create-button']}
            >
              Create DAO
            </TxButton>
          ) : (
            <Button
              onClick={handleDaoEthereum}
              disabled={disabled}
              className={styles['create-button']}
            >
              Create DAO
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
