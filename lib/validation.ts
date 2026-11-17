import { z } from "zod"

const boundedText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value), {
      message: "O texto contém caracteres de controle inválidos.",
    })

export const semanticMappingRequestSchema = z
  .object({
    inputData: boundedText(512),
    inputType: z.enum(["brownfield", "greenfield"]),
    description: boundedText(2000).optional(),
    datatype: z.enum(["BOOL", "INT", "REAL", "DINT", "WORD", "STRING"]).optional(),
    exportFormat: z.enum(["aas", "nodered"]).optional(),
  })
  .strict()

export const billingQuoteSchema = z
  .object({
    operation: z.enum(["mapping", "datasheet", "telemetry", "aasx"]),
    inputData: boundedText(512).optional(),
    description: boundedText(2000).optional(),
    pdfBytes: z.number().int().min(0).max(20 * 1024 * 1024).optional(),
    telemetryPoints: z.number().int().min(0).max(10_000_000).optional(),
    edgeMessages: z.number().int().min(0).max(10_000_000).optional(),
    dataPoints: z.number().int().min(0).max(2000).optional(),
  })
  .strict()

export const hitlDecisionSchema = z
  .object({
    id: boundedText(128),
    decision: z.enum(["approved", "rejected"]),
    finalEclassId: boundedText(128).optional(),
    finalTarget: boundedText(256).optional(),
    finalUnit: boundedText(64).optional(),
  })
  .strict()

export const authRequestSchema = z
  .object({
    action: z.enum(["register", "login", "logout", "rotate_token"]),
    email: z.string().trim().email().max(320).optional(),
    password: z.string().min(8).max(128).optional(),
    displayName: boundedText(120).optional(),
    company: boundedText(160).optional(),
    firebaseIdToken: z.string().trim().min(20).max(8192).optional(),
  })
  .strict()

export const datasheetMetadataSchema = z.object({
  asset_id: boundedText(256),
  manufacturer_name: boundedText(256).optional(),
  product_designation: boundedText(256).optional(),
  serial_number: boundedText(256).optional(),
  year_of_construction: boundedText(16).optional(),
  target_standard: z.literal("ECLASS_14.0"),
  data_points: z
    .array(
      z.object({
        source_tag: boundedText(256),
        description: boundedText(1000),
        data_type: z.enum(["BOOL", "INT", "REAL", "DINT", "WORD", "STRING"]),
        unit: boundedText(64).optional(),
      })
    )
    .min(1)
    .max(2000),
})

export type SemanticMappingRequest = z.infer<typeof semanticMappingRequestSchema>
