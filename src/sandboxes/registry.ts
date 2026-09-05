import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { SandboxId } from '../data/projects'

// Each sandbox is its own lazy chunk: a project page only downloads its own demo.
export const SANDBOXES: Record<SandboxId, LazyExoticComponent<ComponentType>> = {
  fraud: lazy(() => import('./FraudSandbox')),
  monitor: lazy(() => import('./MonitorSandbox')),
  'voice-call': lazy(() => import('./VoiceCallSandbox')),
  pipeline: lazy(() => import('./PipelineSandbox')),
  astra: lazy(() => import('./AstraSandbox')),
  'tracker-gpt': lazy(() => import('./TrackerSandbox')),
  'tracker-nlm': lazy(() => import('./TrackerNlmSandbox')),
  books: lazy(() => import('./BookSandbox')),
  chat: lazy(() => import('./ChatSandbox')),
  ecomm: lazy(() => import('./EcommSandbox')),
  copilot: lazy(() => import('./CopilotSandbox')),
  audit: lazy(() => import('./AuditSandbox')),
  responder: lazy(() => import('./ResponderSandbox')),
  gepa: lazy(() => import('./GepaSandbox')),
  kafka: lazy(() => import('./KafkaSandbox')),
  verbal: lazy(() => import('./VerbalSandbox')),
}
