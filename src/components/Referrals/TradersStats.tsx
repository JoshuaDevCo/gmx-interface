import { Trans, t } from "@lingui/macro";
import { useRef, useState } from "react";
import { BiEditAlt } from "react-icons/bi";
import { IoWarningOutline } from "react-icons/io5";

import { ARBITRUM, AVALANCHE, AVALANCHE_FUJI, getExplorerUrl } from "config/chains";
import { isDevelopment } from "config/env";
import { TotalReferralsStats, useTiers } from "domain/referrals";
import { formatDate } from "lib/dates";
import { shortenAddress } from "lib/legacy";
import { formatBalanceAmount } from "lib/numbers";
import useWallet from "lib/wallets/useWallet";
import { getNativeToken, getToken } from "sdk/configs/tokens";

import ExternalLink from "components/ExternalLink/ExternalLink";
import { BottomTablePagination } from "components/Pagination/BottomTablePagination";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { TableTd, TableTh, TableTheadTr, TableTr } from "components/Table/Table";
import { TableScrollFadeContainer } from "components/TableScrollFade/TableScrollFade";

import EmptyMessage from "./EmptyMessage";
import { ReferralCodeForm } from "./JoinReferralCode";
import ReferralInfoCard from "./ReferralInfoCard";
import { getSharePercentage, getTierIdDisplay, getUSDValue, tierDiscountInfo } from "./referralsHelper";
import usePagination, { DEFAULT_PAGE_SIZE } from "./usePagination";
import Card from "../Common/Card";
import Modal from "../Modal/Modal";
import Tooltip from "../Tooltip/Tooltip";

import "./TradersStats.scss";

type Props = {
  referralsData?: TotalReferralsStats;
  traderTier?: number;
  chainId: number;
  userReferralCodeString?: string;
  discountShare: bigint | undefined;
};

function TradersStats({ referralsData, traderTier, chainId, userReferralCodeString, discountShare }: Props) {
  const { signer } = useWallet();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const editModalRef = useRef<HTMLDivElement>(null);

  const { chains, total } = referralsData || {};
  const {
    [chainId]: currentReferralsData,
    [ARBITRUM]: arbitrumData,
    [AVALANCHE]: avalancheData,
    [AVALANCHE_FUJI]: fujiData,
  } = chains || {};

  const { getCurrentData, currentPage, setCurrentPage, pageCount } = usePagination(
    "TradersStats",
    currentReferralsData?.traderDistributions
  );

  const currentDiscountDistributions = getCurrentData();
  const { totalRebate } = useTiers(signer, chainId, traderTier);
  const currentTierDiscount = getSharePercentage(traderTier, discountShare, totalRebate);

  const open = () => setIsEditModalOpen(true);
  const close = () => setIsEditModalOpen(false);
  return (
    <div className="rebate-container">
      <div className="referral-stats">
        <ReferralInfoCard label={t`Active Referral Code`}>
          <div className="active-referral-code">
            <div className="edit">
              <span>{userReferralCodeString}</span>
              <BiEditAlt onClick={open} />
            </div>
            {traderTier !== undefined ? (
              <div className="tier">
                <Tooltip
                  handle={t`Tier ${getTierIdDisplay(traderTier)} (${currentTierDiscount}% discount)`}
                  position="bottom"
                  className={(discountShare ?? 0) > 0 ? "tier-discount-warning" : ""}
                  renderContent={() => (
                    <p className="text-white">
                      <Trans>You will receive a {currentTierDiscount}% discount on opening and closing fees.</Trans>
                      <br />
                      <br />
                      <Trans>
                        For trades on V1, this discount will be airdropped to your account every Wednesday. On V2,
                        discounts are applied automatically and will reduce your fees when you make a trade.
                      </Trans>
                      {((discountShare ?? 0) > 0 && (
                        <>
                          <br />
                          <br />
                          <Trans>
                            The owner of this Referral Code has set a custom discount of {currentTierDiscount}% instead
                            of the standard {tierDiscountInfo[traderTier]}% for Tier {getTierIdDisplay(traderTier)}.
                          </Trans>
                        </>
                      )) ||
                        null}
                    </p>
                  )}
                />
              </div>
            ) : null}
          </div>
        </ReferralInfoCard>
        <ReferralInfoCard
          value={`$${getUSDValue(currentReferralsData?.traderReferralTotalStats?.volume)}`}
          label={t`Trading Volume`}
          labelTooltipText={t`Volume traded by this account with an active referral code.`}
          tooltipContent={
            <>
              <StatsTooltipRow
                label={t`V1 Arbitrum`}
                value={getUSDValue(arbitrumData?.traderReferralTotalStats.v1Data.volume)}
              />
              <StatsTooltipRow
                label={t`V1 Avalanche`}
                value={getUSDValue(avalancheData?.traderReferralTotalStats.v1Data.volume)}
              />
              {isDevelopment() && (
                <StatsTooltipRow
                  label={t`V1 Avalanche Fuji`}
                  value={getUSDValue(fujiData?.traderReferralTotalStats.v1Data.volume)}
                />
              )}
              <StatsTooltipRow
                label={t`V2 Arbitrum`}
                value={getUSDValue(arbitrumData?.traderReferralTotalStats.v2Data.volume)}
              />
              <StatsTooltipRow
                label={t`V2 Avalanche`}
                value={getUSDValue(avalancheData?.traderReferralTotalStats.v2Data.volume)}
              />
              {isDevelopment() && (
                <StatsTooltipRow
                  label={t`V2 Avalanche Fuji`}
                  value={getUSDValue(fujiData?.traderReferralTotalStats.v2Data.volume)}
                />
              )}
              <div className="Tooltip-divider" />
              <StatsTooltipRow label={t`Total`} value={getUSDValue(total?.traderVolume)} />
            </>
          }
        />
        <ReferralInfoCard
          value={`$${getUSDValue(currentReferralsData?.traderReferralTotalStats?.discountUsd)}`}
          label={t`Rebates`}
          labelTooltipText={t`Rebates earned by this account as a trader.`}
          tooltipContent={
            <>
              <StatsTooltipRow
                label={t`V1 Arbitrum`}
                value={getUSDValue(arbitrumData?.traderReferralTotalStats.v1Data.discountUsd)}
              />
              <StatsTooltipRow
                label={t`V1 Avalanche`}
                value={getUSDValue(avalancheData?.traderReferralTotalStats.v1Data.discountUsd)}
              />
              {isDevelopment() && (
                <StatsTooltipRow
                  label={t`V1 Avalanche Fuji`}
                  value={getUSDValue(avalancheData?.traderReferralTotalStats.v1Data.discountUsd)}
                />
              )}
              <StatsTooltipRow
                label={t`V2 Arbitrum`}
                value={getUSDValue(arbitrumData?.traderReferralTotalStats.v2Data.discountUsd)}
              />
              <StatsTooltipRow
                label={t`V2 Avalanche`}
                value={getUSDValue(avalancheData?.traderReferralTotalStats.v2Data.discountUsd)}
              />
              {isDevelopment() && (
                <StatsTooltipRow
                  label={t`V2 Avalanche Fuji`}
                  value={getUSDValue(fujiData?.traderReferralTotalStats.v2Data.discountUsd)}
                />
              )}
              <div className="Tooltip-divider" />
              <StatsTooltipRow label={t`Total`} value={getUSDValue(total?.discountUsd)} />
            </>
          }
        />
        <Modal
          className="Connect-wallet-modal"
          isVisible={isEditModalOpen}
          setIsVisible={close}
          label={t`Edit Referral Code`}
          onAfterOpen={() => editModalRef.current?.focus()}
        >
          <div className="edit-referral-modal">
            <ReferralCodeForm
              userReferralCodeString={userReferralCodeString}
              type="edit"
              callAfterSuccess={() => setIsEditModalOpen(false)}
            />
          </div>
        </Modal>
      </div>
      {currentDiscountDistributions.length > 0 ? (
        <div className="reward-history">
          <Card
            title={t`Rebates Distribution History`}
            tooltipText={t`V1 rebates are airdropped weekly. V2 rebates are automatically applied as fee discounts on each trade and do not show on this table.`}
            bodyPadding={false}
            divider={false}
          >
            <TableScrollFadeContainer>
              <table className="w-full min-w-max">
                <thead>
                  <TableTheadTr bordered>
                    <TableTh scope="col">
                      <Trans>Date</Trans>
                    </TableTh>
                    <TableTh scope="col">
                      <Trans>Type</Trans>
                    </TableTh>
                    <TableTh scope="col">
                      <Trans>Amount</Trans>
                    </TableTh>
                    <TableTh scope="col">
                      <Trans>Transaction</Trans>
                    </TableTh>
                  </TableTheadTr>
                </thead>
                <tbody>
                  {currentDiscountDistributions.map((rebate) => {
                    const amountsByTokens = rebate.tokens.reduce(
                      (acc, tokenAddress, i) => {
                        let token;
                        try {
                          token = getToken(chainId, tokenAddress);
                        } catch (error) {
                          token = getNativeToken(chainId);
                        }
                        acc[token.address] = acc[token.address] ?? 0n;
                        acc[token.address] = acc[token.address] + rebate.amounts[i];
                        return acc;
                      },
                      {} as { [address: string]: bigint }
                    );
                    const tokensWithoutPrices: string[] = [];

                    const totalUsd = rebate.amountsInUsd.reduce((acc, amount, i) => {
                      if (amount == 0n && rebate.amounts[i] != 0n) {
                        tokensWithoutPrices.push(rebate.tokens[i]);
                      }

                      return acc + amount;
                    }, 0n);

                    const explorerURL = getExplorerUrl(chainId);
                    return (
                      <TableTr key={rebate.id} hoverable={false} bordered={false}>
                        <TableTd data-label="Date">{formatDate(rebate.timestamp)}</TableTd>
                        <TableTd data-label="Type">V1 Airdrop</TableTd>
                        <TableTd data-label="Amount" className="Rebate-amount">
                          <Tooltip
                            position="bottom"
                            className="whitespace-nowrap"
                            handle={
                              <div className="Rebate-amount-value">
                                {tokensWithoutPrices.length > 0 && (
                                  <>
                                    <IoWarningOutline color="#ffba0e" size={16} />
                                    &nbsp;
                                  </>
                                )}
                                ${getUSDValue(totalUsd)}
                              </div>
                            }
                            content={
                              <>
                                {tokensWithoutPrices.length > 0 && (
                                  <>
                                    <Trans>
                                      USD Value may not be accurate since the data does not contain prices for{" "}
                                      {tokensWithoutPrices
                                        .map((address) => getToken(chainId, address).symbol)
                                        .join(", ")}
                                    </Trans>
                                    <br />
                                    <br />
                                  </>
                                )}
                                {Object.keys(amountsByTokens).map((tokenAddress) => {
                                  const token = getToken(chainId, tokenAddress);

                                  return (
                                    <StatsTooltipRow
                                      key={tokenAddress}
                                      showDollar={false}
                                      label={token.symbol}
                                      value={formatBalanceAmount(
                                        amountsByTokens[tokenAddress],
                                        token.decimals,
                                        undefined,
                                        { isStable: token.isStable }
                                      )}
                                    />
                                  );
                                })}
                              </>
                            }
                          />
                        </TableTd>
                        <TableTd data-label="Transaction">
                          <ExternalLink href={explorerURL + `tx/${rebate.transactionHash}`}>
                            {shortenAddress(rebate.transactionHash, 20)}
                          </ExternalLink>
                        </TableTd>
                      </TableTr>
                    );
                  })}
                  {currentDiscountDistributions.length > 0 &&
                    currentDiscountDistributions.length < DEFAULT_PAGE_SIZE && (
                      // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
                      <tr style={{ height: 42.5 * (DEFAULT_PAGE_SIZE - currentDiscountDistributions.length) }}></tr>
                    )}
                </tbody>
              </table>
            </TableScrollFadeContainer>
            <BottomTablePagination page={currentPage} pageCount={pageCount} onPageChange={setCurrentPage} />
          </Card>
        </div>
      ) : (
        <EmptyMessage
          tooltipText={t`V1 rebates are airdropped weekly. V2 rebates are automatically applied as fee discounts on each trade and do not show on this table.`}
          message={t`No rebates distribution history yet.`}
        />
      )}
    </div>
  );
}

export default TradersStats;
