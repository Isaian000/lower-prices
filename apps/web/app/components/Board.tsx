import type { Offer, ProductGroup } from "@lower-prices/shared";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatBoardPrice } from "~/lib/format";
import { thumbnailUrl } from "~/lib/images";

import styles from "./Board.module.css";

/** Etiquetas visibles por producto antes de "Ver N tiendas más". */
const VISIBLE_OFFERS = 3;

interface BoardProps {
  groups: readonly ProductGroup[];
  /** Tiendas consultadas, para decir «Solo en 1 de 4 tiendas». */
  storeCount: number;
}

/**
 * Lista de productos. Cada producto muestra sus ofertas como etiquetas de anaquel,
 * de la más barata a la más cara. Funciona igual con 2 o con 20 tiendas: se ven las
 * primeras y el resto se despliega en el mismo lugar.
 */
export function Board({ groups, storeCount }: BoardProps) {
  return (
    <ol className={styles.list}>
      {groups.map((group) => (
        <ProductRow key={group.id} group={group} storeCount={storeCount} />
      ))}
    </ol>
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

function ProductRow({ group, storeCount }: { group: ProductGroup; storeCount: number }) {
  const { t } = useTranslation("search");
  const titleId = useId();
  const offersId = useId();
  const [expanded, setExpanded] = useState(false);

  // La API ya las entrega con stock primero y de menor a mayor precio.
  const offers = group.offers;
  const best =
    group.offerCount > 1
      ? offers.find((offer) => offer.available && offer.price === group.lowestPrice)
      : undefined;
  const visible = expanded ? offers : offers.slice(0, VISIBLE_OFFERS);
  const hidden = offers.length - VISIBLE_OFFERS;
  const matched = matchedKey(group);

  return (
    <li className={styles.row}>
      <article className={styles.article} aria-labelledby={titleId}>
        <div className={styles.product}>
          <div className={styles.thumb}>
            {group.imageUrl && (
              <img
                src={thumbnailUrl(group.imageUrl, 200)}
                alt=""
                width={96}
                height={96}
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
            {matched ? (
              <p className={styles.matched} data-level={group.matchedBy}>
                {t(matched, { count: group.offerCount })}
              </p>
            ) : (
              storeCount > 1 && (
                <p className={styles.matched}>
                  {t("group.onlyIn", { count: group.offerCount, total: storeCount })}
                </p>
              )
            )}
            {best && group.highestPrice > group.lowestPrice && (
              <p className={styles.spread}>
                {t("group.spread", {
                  amount: formatBoardPrice(group.highestPrice - group.lowestPrice),
                })}
              </p>
            )}
          </div>
        </div>

        <div className={styles.offers}>
          <ul id={offersId} className={styles.labels} aria-label={t("group.offersLabel")}>
            {visible.map((offer, index) => (
              <li
                key={offer.id}
                className={styles.labelItem}
                data-revealed={index >= VISIBLE_OFFERS}
                style={{ "--i": Math.max(index - VISIBLE_OFFERS, 0) } as React.CSSProperties}
              >
                <PriceLabel offer={offer} isBest={offer === best} />
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <button
              type="button"
              className={styles.more}
              aria-expanded={expanded}
              aria-controls={offersId}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? t("group.showLess") : t("group.showMore", { count: hidden })}
            </button>
          )}
        </div>
      </article>
    </li>
  );
}

/**
 * Precio como en la etiqueta de anaquel: el signo de pesos más chico y los dígitos
 * grandes. El lector de pantalla lo lee completo («$6,997»).
 */
function Price({ amount }: { amount: number }) {
  const text = formatBoardPrice(amount);
  const hasSign = text.startsWith("$");
  return (
    <span className={styles.price}>
      {hasSign && <span className={styles.currency}>$</span>}
      {hasSign ? text.slice(1) : text}
    </span>
  );
}

/** Etiqueta de anaquel de una oferta. Toda la etiqueta es el enlace a la tienda. */
function PriceLabel({ offer, isBest }: { offer: Offer; isBest: boolean }) {
  const { t } = useTranslation("search");
  const plan = bestInstallment(offer);

  return (
    <a
      className={styles.label}
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-best={isBest}
      data-sold-out={!offer.available}
    >
      {isBest && <span className={styles.bestBand}>{t("group.lowest")}</span>}
      <span className={styles.labelBody}>
        <span className={styles.store}>
          {offer.store.name}
          <svg aria-hidden="true" viewBox="0 0 12 12" className={styles.outbound}>
            <path d="M4 2.5h5.5V8M9.25 2.75 2.75 9.25" />
          </svg>
        </span>
        <Price amount={offer.price} />
        {!offer.available && <span className={styles.soldOut}>{t("offer.soldOut")}</span>}
        {offer.originalPrice !== undefined && offer.discountPercent !== undefined && (
          <span className={styles.discount}>
            <s>{t("offer.was", { price: formatBoardPrice(offer.originalPrice) })}</s>
            <span>{t("offer.discount", { percent: offer.discountPercent })}</span>
          </span>
        )}
        {plan && (
          <span className={styles.msi}>
            {t("offer.msi", { months: plan.months, amount: formatBoardPrice(plan.amount) })}
          </span>
        )}
      </span>
      <span className="visually-hidden">{t("offer.newTab")}</span>
    </a>
  );
}

/** Productos y etiquetas vacíos mientras las tiendas responden. */
export function BoardSkeleton({ rows = 4 }: { rows?: number }) {
  const { t } = useTranslation("search");

  return (
    <div aria-busy="true">
      <p className="visually-hidden" role="status">
        {t("loading")}
      </p>
      <div className={styles.list} aria-hidden="true">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className={`${styles.row} ${styles.skeleton}`}>
            <div className={styles.article}>
              <div className={styles.product}>
                <div className={styles.thumb} />
                <div className={styles.productText}>
                  <span className={styles.bar} style={{ width: `${78 - row * 10}%` }} />
                  <span className={styles.bar} style={{ width: "32%" }} />
                </div>
              </div>
              <div className={styles.offers}>
                <div className={styles.labels}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className={`${styles.label} ${styles.labelGhost}`}>
                      <span className={styles.labelBody}>
                        <span className={styles.bar} style={{ width: "45%" }} />
                        <span className={`${styles.bar} ${styles.barPrice}`} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
