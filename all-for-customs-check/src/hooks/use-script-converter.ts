import { useMemo } from 'react'
import type { Language, ScriptVariant } from '@/types'
import { applyScriptVariant } from '@/lib/translations'

export function useScriptConverter(
  text: string | undefined,
  language: Language,
  scriptVariant: ScriptVariant
): string {
  return useMemo(() => {
    if (!text) return ''
    return applyScriptVariant(text, language, scriptVariant)
  }, [text, language, scriptVariant])
}

export function useScriptConverterBulk(
  texts: string[],
  language: Language,
  scriptVariant: ScriptVariant
): string[] {
  return useMemo(() => {
    return texts.map(text => applyScriptVariant(text, language, scriptVariant))
  }, [texts, language, scriptVariant])
}
