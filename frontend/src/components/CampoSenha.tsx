import { useId, useState, type ComponentProps } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'

type Props = Omit<ComponentProps<'input'>, 'type' | 'id'> & {
  rotulo: string
  dica?: string
  autenticacao?: boolean
}

export function CampoSenha({ rotulo, dica, autenticacao = false, ...props }: Props) {
  const id = useId()
  const [visivel, setVisivel] = useState(false)
  return (
    <div className={autenticacao ? 'field' : 'module-field'}>
      <label htmlFor={id}>{rotulo}</label>
      <span className={autenticacao ? 'input-wrap' : 'senha-wrap'}>
        {autenticacao && <LockKeyhole size={17} aria-hidden="true" />}
        <input {...props} id={id} type={visivel ? 'text' : 'password'} aria-describedby={dica ? `${id}-dica` : undefined} />
        <button className="senha-visibilidade" type="button" aria-label={`${visivel ? 'Ocultar' : 'Mostrar'} ${rotulo.toLocaleLowerCase('pt-BR')}`} onClick={() => setVisivel((atual) => !atual)}>
          {visivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
      {dica && <small id={`${id}-dica`}>{dica}</small>}
    </div>
  )
}
