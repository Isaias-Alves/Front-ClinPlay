import { useEffect } from "react";

/**
 * Impede o aparelho de apagar a tela enquanto a tela estiver ativa.
 *
 * Durante um exercício o paciente acompanha o motor visual sem encostar no
 * celular — e o Android e o iOS apagam a tela depois de 30 s a 1 min sem
 * toque. Sem isso, o biofeedback simplesmente some no meio da contração,
 * que é justamente quando ele mais importa.
 *
 * A Screen Wake Lock API não existe em todos os navegadores (notavelmente
 * no Safari antes do iOS 16.4), então tudo aqui é best-effort: falhar em
 * obter o lock nunca pode quebrar o exercício.
 *
 * O lock é perdido automaticamente quando a aba vai para segundo plano, por
 * isso ele é readquirido no `visibilitychange` — sem isso, atender uma
 * ligação no meio da série deixaria a tela apagando de novo ao voltar.
 *
 * @param ativo Enquanto `true`, mantém a tela acesa.
 */
export function useManterTelaAcesa(ativo: boolean): void {
  useEffect(() => {
    if (!ativo || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelado = false;

    const adquirir = async () => {
      // Só é possível pedir o lock com o documento visível; tentar em
      // segundo plano lança `NotAllowedError`.
      if (cancelado || document.visibilityState !== "visible") return;

      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Negado pelo usuário, bateria fraca ou API indisponível. O
        // exercício segue normalmente, só sem manter a tela acesa.
      }
    };

    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") void adquirir();
    };

    void adquirir();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      void lock?.release().catch(() => {});
    };
  }, [ativo]);
}

export default useManterTelaAcesa;
