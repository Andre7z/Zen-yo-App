import type { ComponentProps } from 'react'
import { Search } from 'lucide-react'
import { CampoModulo } from './PaginaModulo'

type Props = Omit<ComponentProps<'input'>, 'type'> & { rotulo: string }

export function CampoBusca({ rotulo, ...props }: Props) {
  return <CampoModulo rotulo={rotulo}>
    <span className="campo-busca">
      <Search size={17} aria-hidden="true" />
      <input {...props} type="search" />
    </span>
  </CampoModulo>
}
