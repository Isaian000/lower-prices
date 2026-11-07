import { z } from "zod";

// Solo se validan los campos que usa el adaptador. El resto de la respuesta se ignora.

const installmentSchema = z.object({
  Value: z.number(),
  InterestRate: z.number(),
  TotalValuePlusInterestRate: z.number(),
  NumberOfInstallments: z.number().int(),
  PaymentSystemGroupName: z.string().nullish(),
});

const commertialOfferSchema = z.object({
  Price: z.number(),
  ListPrice: z.number().nullish(),
  AvailableQuantity: z.number(),
  IsAvailable: z.boolean().optional(),
  Installments: z.array(installmentSchema).nullish(),
});

const sellerSchema = z.object({
  sellerId: z.string(),
  sellerDefault: z.boolean(),
  commertialOffer: commertialOfferSchema,
});

const itemSchema = z.object({
  itemId: z.string(),
  ean: z.string().nullish(),
  images: z.array(z.object({ imageUrl: z.string() })).nullish(),
  sellers: z.array(sellerSchema),
});

export const vtexProductSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  brand: z.string().nullish(),
  link: z.string(),
  /** Especificación que algunas tiendas (Elektra, OfficeMax) publican con el modelo. */
  Modelo: z.array(z.string()).optional(),
  items: z.array(itemSchema),
});

export type VtexProduct = z.infer<typeof vtexProductSchema>;
export type VtexItem = z.infer<typeof itemSchema>;
export type VtexSeller = z.infer<typeof sellerSchema>;
export type VtexInstallment = z.infer<typeof installmentSchema>;
