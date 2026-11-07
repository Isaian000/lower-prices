import type { Offer, ProductGroup, Store } from "@lower-prices/shared";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { formatBoardPrice } from "~/lib/format";
import { thumbnailUrl } from "~/lib/images";

import styles from "./Board.module.css";

interface BoardProps {
  /** Columnas del tablero, en orden. */
  stores: readonly Store[];
  groups: readonly ProductGroup[];
  /** Posición del primer grupo nuevo: solo esas filas encienden sus dígitos. */
  animateFrom?: number;
}

type BoardStyle = React.CSSProperties & Record<`--${string}`, string | number>;

/**
 * La pizarra: una fila por producto y una columna por tienda.
 * En pantallas angostas cada fila apila sus tiendas bajo el producto.
 */
export function Board({ stores, groups, animateFrom = 0 }: BoardProps) {
  const { t } = useTranslation("search");
  const style: BoardStyle = { "--stores": stores.length };

  return (
    <div className={styles.board} style={style}>
      <div className={styles.columns} aria-hidden="true">
        <span>{t("columns.product")}</span>
        {stores.map((store) => (
          <span key={store.id}>{store.name}</span>
        ))}
      </div>
      <ol className={styles.rows}>
        {groups.map((group, index) => (
          <BoardRow
            key={group.id}
            group={group}
            stores={stores}
            animationIndex={index >= animateFrom ? index - animateFrom : undefined}
          />
        ))}
      </ol>
    </div>
  );
}

function matchedKey(group: ProductGroup) {
  switch (group.matchedBy) {
    case "gtin":
      return "group.matched_gtin" as const;
    case "model":
      return "group.matched_model" as const;
    case "title":
      return "group.matched_title" as const;
    case "single":
      return undefined;
  }
}

/** El mayor plazo sin intereses es el dato que más pesa al decidir. */
function bestInstallment(offer: Offer) {
  return offer.installments
    .filter((plan) => plan.interestFree)
    .toSorted((a, b) => b.months - a.months)[0];
}

function BoardRow({
  group,
  stores,
  animationIndex,
}: {
  group: ProductGroup;
  stores: readonly Store[];
  animationIndex: number | undefined;
}) {
  const { t } = useTranslation("search");
  const titleId = useId();
  const byStore = new Map(group.offers.map((offer) => [offer.store.id, offer]));
  const compared = group.offerCount > 1;
  const lowest = compared
    ? group.offers.find((offer) => offer.available && offer.price === group.lowestPrice)
    : undefined;
  const matched = matchedKey(group);
  const style: BoardStyle | undefined =
    animationIndex === undefined ? undefined : { "--row": Math.min(animationIndex, 12) };

  return (
    <li className={styles.row} data-animate={animationIndex !== undefined} style={style}>
      <article className={styles.article} aria-labelledby={titleId}>
        <div className={styles.product}>
          <div className={styles.thumb}>
            {group.imageUrl && (
              <img
                src={thumbnailUrl(group.imageUrl, 160)}
                alt=""
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <div className={styles.productText}>
            <h3 id={titleId} className={styles.title}>
              {group.title}
            </h3>
            {(group.brand || group.model) && (
              <p className={styles.identity}>
                {group.brand && <span>{group.brand}</span>}
                {group.model && <span>{group.model}</span>}
              </p>
            )}
            {matched && (
              <p className={styles.matched} data-level={group.matchedBy}>
                {t(matched, { count: group.offerCount })}
              </p>
            )}
            {compared && group.highestPrice > group.lowestPrice && (
              <p className={styles.spread}>
                {t("group.spread", {
                  amount: formatBoardPrice(group.highestPrice - group.lowestPrice),
                })}
              </p>
            )}
          </div>
        </div>

        <dl className={styles.cells}>
          {stores.map((store, column) => {
            const offer = byStore.get(store.id);
            return (
              <div
                key={store.id}
                className={styles.cell}
                data-empty={!offer}
                data-lowest={offer !== undefined && offer === lowest}
                style={{ "--col": column } as BoardStyle}
              >
                <dt className={styles.storeName}>{store.name}</dt>
                <dd className={styles.cellBody}>
                  {offer ? (
                    <OfferCell offer={offer} isLowest={offer === lowest} />
                  ) : (
                    <>
                      <span aria-hidden="true" className={styles.ledStack}>
                        <span className={styles.ghost}>{UNLIT}</span>
                      </span>
                      <span className="visually-hidden">
                        {t("group.noOffer", { store: store.name })}
                      </span>
                    </>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </article>
    </li>
  );
}

/** Segmentos apagados de una celda sin precio: el módulo del tablero sin encender. */
const UNLIT = "$8,888";

/**
 * Precio en dígitos de matriz de puntos, con los segmentos apagados detrás (como en el
 * tablero físico). El fantasma es decorativo; el lector de pantalla lee solo el precio.
 */
function Led({ value }: { value: string }) {
  return (
    <span className={styles.ledStack}>
      <span aria-hidden="true" className={styles.ghost}>
        {value.replace(/\d/g, "8")}
      </span>
      <span className={styles.led}>{value}</span>
    </span>
  );
}

function OfferCell({ offer, isLowest }: { offer: Offer; isLowest: boolean }) {
  const { t } = useTranslation("search");
  const plan = bestInstallment(offer);

  return (
    <>
      <a
        className={styles.offerLink}
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        data-sold-out={!offer.available}
      >
        <Led value={formatBoardPrice(offer.price)} />
        <span className="visually-hidden">
          {isLowest ? `${t("group.lowest")}. ` : ""}
          {t("offer.goTo", { store: offer.store.name })} {t("offer.newTab")}
        </span>
      </a>
      {isLowest && (
        <span className={styles.lowestTag} aria-hidden="true">
          {t("group.lowestTag")}
        </span>
      )}
      {!offer.available && <span className={styles.soldOut}>{t("offer.soldOut")}</span>}
      {offer.originalPrice !== undefined && offer.discountPercent !== undefined && (
        <span className={styles.discount}>
          <s>{t("offer.was", { price: formatBoardPrice(offer.originalPrice) })}</s>
          <strong>{t("offer.discount", { percent: offer.discountPercent })}</strong>
        </span>
      )}
      {plan && (
        <span className={styles.msi}>
          {t("offer.msi", { months: plan.months, amount: formatBoardPrice(plan.amount) })}
        </span>
      )}
    </>
  );
}

/** Filas con dígitos apagados mientras las tiendas responden. */
export function BoardSkeleton({ stores, rows = 4 }: { stores: readonly Store[]; rows?: number }) {
  const { t } = useTranslation("search");
  const style: BoardStyle = { "--stores": Math.max(stores.length, 1) };

  return (
    <div className={styles.board} style={style} aria-busy="true">
      <p className="visually-hidden" role="status">
        {t("loading")}
      </p>
      <div className={styles.columns} aria-hidden="true">
        <span>{t("columns.product")}</span>
        {stores.map((store) => (
          <span key={store.id}>{store.name}</span>
        ))}
      </div>
      <div className={styles.rows} aria-hidden="true">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className={`${styles.row} ${styles.skeletonRow}`}>
            <div className={styles.article}>
              <div className={styles.product}>
                <div className={styles.thumb} />
                <div className={styles.productText}>
                  <span className={styles.bar} style={{ width: `${70 - row * 9}%` }} />
                  <span className={styles.bar} style={{ width: "35%" }} />
                </div>
              </div>
              <div className={styles.cells}>
                {stores.map((store) => (
                  <div key={store.id} className={styles.cell}>
                    <span className={styles.storeName}>{store.name}</span>
                    <span className={styles.ledStack}>
                      <span className={styles.ghost}>{UNLIT}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
