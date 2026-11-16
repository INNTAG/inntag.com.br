import { BadgeCheck } from 'lucide-react';

/**
 * O D-U-N-S NUMBER DO GRUPO INNTAG, NO RODAPÉ.
 *
 * O D-U-N-S é o identificador que a Dun & Bradstreet dá a uma empresa no
 * cadastro internacional dela. Quem compra de fora, quem faz due diligence
 * e quem cadastra fornecedor em multinacional procura esse número: é com
 * ele que o Grupo INNTAG deixa de ser um nome num site e passa a ser uma
 * empresa com ficha aberta lá fora.
 *
 * Fica ao lado do CNPJ, de propósito. Os dois são a mesma coisa em
 * jurisdições diferentes -- a identidade cadastral da empresa -- e quem
 * procura um já está olhando para onde o outro está.
 *
 * O selo é escrito com a tipografia e as cores deste site. A Dun &
 * Bradstreet tem um selo próprio, o "D-U-N-S Registered", que ela entrega
 * a quem conclui o programa dela e vem com endereço de verificação.
 * Desenhar aqui uma imitação dele seria vestir uma marca que não é nossa.
 * Quando o selo oficial chegar, ele entra trocando este bloco.
 *
 * O mesmo selo existe no site da INNTAG Solar. Os dois são irmãos de
 * conteúdo, não de código: cada site tem seu próprio sistema de cores, e
 * compartilhar o arquivo obrigaria um deles a vestir a paleta do outro.
 */

/** O número vem cru e é formatado aqui, para não haver duas verdades. */
const NUMERO = '899835790';

/**
 * A Dun & Bradstreet escreve o número em três grupos: 89-983-5790. Guardar
 * cru e formatar na hora evita o erro clássico de alguém copiar o número
 * formatado para um cadastro que só aceita os nove dígitos.
 */
const formatado = `${NUMERO.slice(0, 2)}-${NUMERO.slice(2, 5)}-${NUMERO.slice(5)}`;

export default function SeloDuns({ className = '' }: { className?: string }) {
  return (
    <div
      title={`D-U-N-S Number do Grupo INNTAG: ${NUMERO}`}
      className={`inline-flex items-center gap-2.5 rounded-full border border-background/15 bg-background/5 px-3.5 py-2 ${className}`}
    >
      <BadgeCheck size={16} className="text-accent shrink-0" aria-hidden="true" />
      <div className="leading-none">
        <div className="text-[9px] uppercase tracking-[0.14em] text-background/40">
          D-U-N-S<span className="align-super text-[7px]">®</span> Number
        </div>
        <div className="mt-1 text-xs font-semibold tracking-[0.08em] text-background/80 tabular-nums">
          {formatado}
        </div>
      </div>
    </div>
  );
}
