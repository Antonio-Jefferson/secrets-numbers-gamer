export default function Instructions() {
  return (
    <div className="max-w-2xl mx-auto bg-gray-900 text-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4">📌 Objetivo do Jogo</h1>
      <p className="mb-4">
        O objetivo do jogo é descobrir todos os números secretos do seu oponente
        antes que ele descubra os seus.
      </p>

      <h2 className="text-xl font-semibold mb-2">📝 Regras</h2>
      <h3 className="text-lg font-medium mt-4">Escolha dos Números:</h3>
      <ul className="list-disc pl-5 mb-4">
        <li>Cada jogador escolhe 5 números secretos no início da partida.</li>
        <li>Esses números serão mantidos ocultos para o adversário.</li>
      </ul>

      <h3 className="text-lg font-medium mt-4">Turnos:</h3>
      <ul className="list-disc pl-5 mb-4">
        <li>O jogo segue um sistema de turnos alternados.</li>
        <li>Apenas o jogador da vez pode tentar adivinhar um número.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-4">🎯 Dando Palpites</h2>
      <h3 className="text-lg font-medium mt-4">Como funciona o palpite?</h3>
      <p className="mb-4">
        O jogador deve adivinhar o próximo número da sequência do adversário,
        seguindo a ordem correta.
      </p>

      <h3 className="text-lg font-medium mt-4">O que acontece se acertar?</h3>
      <ul className="list-disc pl-5 mb-4">
        <li>
          Se o palpite corresponder ao próximo número da sequência do oponente,
          ele será revelado.
        </li>
        <li>O jogador pode continuar jogando.</li>
      </ul>

      <h3 className="text-lg font-medium mt-4">O que acontece se errar?</h3>
      <ul className="list-disc pl-5 mb-4">
        <li>Se o palpite estiver errado, o jogador recebe uma dica.</li>
        <li>
          "O número correto é maior que X" ou "O número correto é menor que X".
        </li>
        <li>A vez passa para o outro jogador.</li>
      </ul>

      <h3 className="text-lg font-medium mt-4">Como vencer?</h3>
      <p className="mb-4">
        O primeiro jogador a revelar todos os números da sequência do oponente
        vence o jogo! 🎉
      </p>

      <h3 className="text-lg font-medium mt-4">⚠️ Exemplo prático:</h3>
      <p className="mb-4">
        Suponha que o Jogador 1 escolheu os números secretos:{" "}
        <span className="font-bold">4, 8, 15, 16, 23</span>.
      </p>
      <p className="mb-4">
        O Jogador 2 precisa adivinhar nessa ordem. Se chutar 8 primeiro, estará
        errado, pois o primeiro número é 4. Se acertar 4, pode tentar o próximo
        número (8) no próximo turno.
      </p>

      <h3 className="text-lg font-medium mt-4">🔄 Reiniciar o Jogo:</h3>
      <p className="mb-4">
        Se quiser jogar novamente, basta clicar no botão de reinício e escolher
        novos números.
      </p>

      <h3 className="text-lg font-medium mt-4">
        🎮 Criando e Entrando em uma Partida:
      </h3>
      <ul className="list-disc pl-5 mb-4">
        <li>
          Para criar uma partida, vá em <span className="font-bold">Criar</span>
          .
        </li>
        <li>
          Você pode pegar o ID do jogo e enviá-lo para alguém entrar na partida.
        </li>
        <li>
          A pessoa que deseja entrar deve ir em{" "}
          <span className="font-bold">Entrar em Partida</span> e inserir o ID.
        </li>
      </ul>
    </div>
  );
}
