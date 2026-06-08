'use client'

import { MascotBubble, type MascotPose } from './MascotBubble'

type Species  = 'dog' | 'cat' | 'other'
type Section  = 'welcome' | 'photo' | 'location' | 'description' | 'contact' | 'success' | 'error'

interface Tip {
  pose: MascotPose
  message: string
}

const TIPS: Record<Section, Record<'dog' | 'cat', Tip>> = {
  welcome: {
    dog: { pose: 'dog-wave',      message: 'Olá! Estou aqui pra ajudar. Quanto mais detalhes você colocar, mais rápido a gente encontra!' },
    cat: { pose: 'cat-sit',       message: 'Miau! Pronto pra ajudar. Cada detalhe conta — preencha com carinho.' },
  },
  photo: {
    dog: { pose: 'dog-detective', message: 'Uma foto recente e bem iluminada faz toda a diferença! Sem filtros, de preferência.' },
    cat: { pose: 'cat-detective', message: 'Gatos adoram se esconder. Uma boa foto ajuda quem encontrou a reconhecer!' },
  },
  location: {
    dog: { pose: 'dog-detective', message: 'Marque o lugar exato onde foi visto por último. Isso acelera muito a busca!' },
    cat: { pose: 'cat-detective', message: 'Gatos raramente vão longe. Marque a localização com precisão!' },
  },
  description: {
    dog: { pose: 'dog-run',       message: 'Descreva manchas, coleira, chip ou qualquer marca especial. Ajuda a identificar na hora!' },
    cat: { pose: 'cat-sit',       message: 'Cor dos olhos, pelagem, microchip? Qualquer detalhe único facilita o reconhecimento.' },
  },
  contact: {
    dog: { pose: 'dog-wave',      message: 'Quase pronto! Coloque um contato — WhatsApp fica mais rápido para chamar.' },
    cat: { pose: 'cat-sit',       message: 'Só mais um passo! Assim quem encontrar seu gatinho consegue te chamar.' },
  },
  success: {
    dog: { pose: 'dog-wave',      message: '🎉 Registrado! Agora a rede toda vai ajudar. Boa sorte no reencontro!' },
    cat: { pose: 'cat-flag',      message: '🎉 Pronto! A rede está ativada. Logo você vai ter notícias!' },
  },
  error: {
    dog: { pose: 'dog-sad',       message: 'Ops... algo deu errado. Mas não desista — tente novamente!' },
    cat: { pose: 'cat-sit',       message: 'Hmm, não funcionou. Verifique sua conexão e tente de novo.' },
  },
}

function resolveTip(section: Section, species: Species): Tip {
  const key = species === 'other' ? 'dog' : species
  return TIPS[section][key]
}

interface MascotFormGuideProps {
  species: Species
  section?: Section
  className?: string
}

export function MascotFormGuide({
  species,
  section = 'welcome',
  className,
}: MascotFormGuideProps) {
  const { pose, message } = resolveTip(section, species)

  return (
    <div className={`flex justify-center py-2 ${className ?? ''}`}>
      <MascotBubble pose={pose} message={message} size={72} />
    </div>
  )
}
