import type { Anamnese, TriageResult } from './types'

/**
 * RF02 — Triagem e Segurança Clínica.
 * Avalia a anamnese e decide se o protocolo restritivo pode ser liberado
 * ou se exige vínculo com um Profissional Parceiro (Caminho B).
 *
 * Regra de negócio: condições de risco (diabetes, gestação, histórico de
 * transtorno alimentar) BLOQUEIAM o protocolo até liberação médica.
 * Hipertensão e idade extrema geram "atenção" mas não bloqueiam.
 */
export function triage(a: Anamnese): TriageResult {
  const reasons: string[] = []
  let blocked = false

  if (a.hasDiabetes) {
    reasons.push('Diabetes exige acompanhamento clínico para dietas restritivas.')
    blocked = true
  }
  if (a.isPregnant) {
    reasons.push('Gestação/amamentação requer liberação de um profissional de saúde.')
    blocked = true
  }
  if (a.eatingDisorderHistory) {
    reasons.push('Histórico de transtorno alimentar demanda suporte especializado.')
    blocked = true
  }

  const attention: string[] = []
  if (a.hasHypertension) attention.push('Hipertensão — monitore sua pressão durante o protocolo.')
  if (a.age && a.age < 18) {
    attention.push('Menores de 18 anos precisam de responsável e acompanhamento.')
    blocked = true
    reasons.push('Menor de idade: liberação profissional obrigatória.')
  }
  if (a.age && a.age >= 65) attention.push('Acima de 65 anos — recomendamos validação médica prévia.')

  if (blocked) {
    return { level: 'blocked', reasons, requiresPartner: true }
  }
  if (attention.length > 0) {
    return { level: 'attention', reasons: attention, requiresPartner: false }
  }
  return { level: 'clear', reasons: [], requiresPartner: false }
}

export const GOALS = [
  'Emagrecer com saúde',
  'Desinflamar o corpo',
  'Reeducação alimentar',
  'Mais energia e disposição',
  'Clareza mental',
]

export const emptyAnamnese: Anamnese = {
  goal: GOALS[0],
  age: 0,
  hasDiabetes: false,
  hasHypertension: false,
  isPregnant: false,
  eatingDisorderHistory: false,
  medications: '',
  observations: '',
}
