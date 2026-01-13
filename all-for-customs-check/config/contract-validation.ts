// config/contract-validation.ts
// INPUT_CONTEXT validator sa STEP_A implementacijom

import { z } from 'zod'

// Zod sheme za INPUT_CONTEXT validaciju
const AdminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  roles: z.array(z.string())
})

const QuotasSchema = z.object({
  requests_per_minute: z.number().int().positive(),
  storage_gb: z.number().int().positive()
})

const TenantConfigSchema = z.object({
  tenant_id: z.string(),
  plan: z.string(),
  locales: z.array(z.string()),
  admin_users: z.array(AdminUserSchema),
  quotas: QuotasSchema
})

const DocumentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  hash: z.string().regex(/^[a-f0-9]{64}$/), // SHA256
  size_bytes: z.number().int().nonnegative(),
  mime: z.string(),
  created: z.string().datetime({ offset: true }),
  pointer: z.string()
})

const SampleCaseSchema = z.object({
  id: z.string(),
  input_document_id: z.string(),
  expected_hs: z.string().regex(/^\d{4}\.\d{2}\.\d{2}$/),
  notes: z.string()
})

const ExternalSourceSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  trust_level: z.enum(['high', 'medium', 'low']),
  pointer: z.string().optional()
})

const SecurityProfileSchema = z.object({
  kms: z.object({
    key_id: z.string()
  }),
  hsm: z.boolean(),
  tls_min_version: z.string(),
  data_residency: z.enum(['EU', 'US', 'APAC'])
})

const DeploymentProfileSchema = z.object({
  cloud: z.string(),
  region: z.string(),
  mitigers: z.array(z.string())
})

const TestingProfileSchema = z.object({
  coverage_target: z.number().int().min(0).max(100),
  contract_tests: z.boolean(),
  e2e: z.boolean()
})

const IntegrationsConfigSchema = z.object({
  stripe: z.record(z.unknown()).optional(),
  email: z.record(z.unknown()).optional(),
  sms: z.record(z.unknown()).optional(),
  openai: z.record(z.unknown()).optional()
})

const CorpusIndexSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // semver
  pointer: z.string(),
  citation_map: z.record(z.unknown())
})

const InputContextSchema = z.object({
  contract_version: z.literal('1.1'),
  lang: z.literal('bs-Latn'),
  task_id: z.string(),
  time: z.string().datetime({ offset: true }),
  tenant_config: TenantConfigSchema,
  corpus_index: CorpusIndexSchema,
  documents: z.array(DocumentSchema),
  sample_cases: z.array(SampleCaseSchema),
  allowed_external_sources: z.array(ExternalSourceSchema),
  security_profile: SecurityProfileSchema,
  deployment_profile: DeploymentProfileSchema,
  testing_profile: TestingProfileSchema,
  integrations_config: IntegrationsConfigSchema
})

export type InputContext = z.infer<typeof InputContextSchema>

// STEP_A validacija
export interface StepAOutput {
  contract_version: '1.1'
  lang: 'bs-Latn'
  task_id: string
  time: string
  step: 'STEP_A'
  status: 'ok' | 'error'
  reason?: string
  missing_fields?: string[]
}

export interface StopJson {
  contract_version: '1.1'
  lang: 'bs-Latn'
  task_id: string
  time: string
  step: string
  reason: string
  missing_fields: string[]
  remediation: string
}

export function validateInputContext(input: unknown): { valid: true; data: InputContext } | { valid: false; error: StopJson } {
  try {
    const data = InputContextSchema.parse(input)
    return { valid: true, data }
  } catch (err: unknown) {
    const zodError = err instanceof z.ZodError ? err : null
    const missingFields = zodError?.errors
      ?.map((e) => e.path.join('.'))
      .filter(Boolean)
      .sort() || []
    
    return {
      valid: false,
      error: {
        contract_version: '1.1',
        lang: 'bs-Latn',
        task_id: typeof input === 'object' && input !== null && 'task_id' in input ? (input as { task_id?: string }).task_id ?? 'unknown' : 'unknown',
        time: new Date().toISOString(),
        step: 'STEP_A',
        reason: 'missing or invalid required INPUT_CONTEXT fields',
        missing_fields: missingFields,
        remediation: `Provide all required fields: ${missingFields.join(', ')} and retry.`
      }
    }
  }
}

export function generateStepAOutput(input: InputContext): StepAOutput {
  return {
    contract_version: '1.1',
    lang: 'bs-Latn',
    task_id: input.task_id,
    time: input.time,
    step: 'STEP_A',
    status: 'ok'
  }
}
